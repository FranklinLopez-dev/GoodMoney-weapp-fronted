import { KycColaComponent } from './kyc/kyc-cola.component';
import { KycService } from './kyc/kyc.service';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceService, RiesgoPersona } from '../compliance/compliance.service';
import { mostrarError } from '../compliance/compliance-comunes';
import {
    Conciliacion, CuentaDePersona, InformeConciliacion,
    PersonaDetalle, PersonaListado, PersonsService,
} from './persons.service';

/** Solo lectura mientras dure la convivencia con `Profiles`, que es quien manda; solo escribe la conciliación. */
@Component({
    selector: 'app-persons',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule, KycColaComponent],
    templateUrl: './persons.component.html',
    styleUrls: ['./persons.component.scss'],
})
export class PersonsComponent {
    private kyc = inject(KycService);
    private visor = inject(MatDialog);

    /** Abre un documento de identidad con la sesión (files/ no se sirve). */
    verDocumento(personId: number, documentId: number, nombre: string): void {
        this.kyc.documento(personId, documentId).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                this.visor.open(FileViewerDialogComponent, {
                    data: { name: nombre, type: blob.type === 'application/pdf' ? 'PDF' : 'PNG', url },
                    panelClass: 'file-viewer-dialog', maxWidth: '90vw', maxHeight: '90vh',
                }).afterClosed().subscribe(() => URL.revokeObjectURL(url));
            },
            error: () => {},
        });
    }


    private service = inject(PersonsService);
    private cumplimiento = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeConciliar = this.auth.hasPermission(Permission.PersonsManage);
    readonly puedeVerRiesgo = this.auth.hasPermission(Permission.ComplianceIndex);

    readonly tamano = 25;

    /** La ficha vive en la primera pestaña y se abre desde las otras dos: sin esto, "Ver" no hacía nada visible. */
    readonly pestana = signal(0);

    // Listado

    readonly personas = signal<PersonaListado[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(0);
    readonly cargando = signal(false);

    readonly busqueda = signal('');
    readonly tipo = signal('');
    readonly soloListaNegra = signal(false);

    readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano)));

    // Ficha

    readonly persona = signal<PersonaDetalle | null>(null);
    readonly cargandoFicha = signal(false);
    readonly riesgo = signal<RiesgoPersona | null>(null);

    // Trabajo pendiente de soporte

    readonly sinDocumento = signal<PersonaListado[]>([]);
    readonly totalSinDocumento = signal(0);
    readonly paginaSinDocumento = signal(0);
    readonly cargandoSinDocumento = signal(false);

    readonly sinRespaldo = signal<CuentaDePersona[]>([]);
    readonly totalSinRespaldo = signal(0);
    readonly paginaSinRespaldo = signal(0);
    readonly cargandoSinRespaldo = signal(false);

    readonly paginasSinDocumento = computed(() =>
        Math.max(1, Math.ceil(this.totalSinDocumento() / this.tamano)));
    readonly paginasSinRespaldo = computed(() =>
        Math.max(1, Math.ceil(this.totalSinRespaldo() / this.tamano)));

    // Conciliación

    readonly conciliacion = signal<Conciliacion | null>(null);
    readonly cargandoConciliacion = signal(false);
    readonly conciliando = signal(false);
    readonly informe = signal<InformeConciliacion | null>(null);

    constructor() {
        toObservable(this.busqueda)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargar());

        this.cargar();
    }

    alCambiarPestana(indice: number): void {
        this.pestana.set(indice);

        switch (indice) {
            case 1: if (!this.sinDocumento().length) this.cargarSinDocumento(); break;
            case 2: if (!this.sinRespaldo().length) this.cargarSinRespaldo(); break;
            case 3: this.cargarConciliacion(); break;
        }
    }

    // Listado

    cargar(pagina = 0): void {
        this.pagina.set(pagina);
        this.cargando.set(true);

        this.service.listado({
            valor: this.busqueda(),
            tipo: this.tipo(),
            enListaNegra: this.soloListaNegra() ? true : undefined,
            page: pagina,
            recordsByPage: this.tamano,
        })
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => {
                    this.personas.set(r.body ?? []);
                    this.total.set(totalDelEncabezado(r.headers));
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar el listado.'),
            });
    }

    limpiar(): void {
        this.busqueda.set('');
        this.tipo.set('');
        this.soloListaNegra.set(false);
        this.cargar();
    }

    // Ficha

    abrir(id: number): void {
        // La ficha se pinta en la primera pestaña: llegando desde las listas hay que ir allí, o el clic no hace nada visible.
        this.pestana.set(0);
        this.cargandoFicha.set(true);
        this.riesgo.set(null);

        this.service.detalle(id)
            .pipe(finalize(() => this.cargandoFicha.set(false)))
            .subscribe({
                next: p => this.persona.set(p),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar la persona.'),
            });

        // Llamada aparte para que la ficha se pinte igual sin el permiso de cumplimiento.
        if (this.puedeVerRiesgo) {
            this.cumplimiento.riesgo(id).subscribe({
                next: r => this.riesgo.set(r),
                error: () => this.riesgo.set(null),
            });
        }
    }

    cerrar(): void {
        this.persona.set(null);
        this.riesgo.set(null);
    }

    /** `T` = la cuenta es suya; `A` = opera por cuenta de esta persona, que es un tercero. */
    naturaleza(nature: string): string {
        return nature === 'T' ? 'Titular de la cuenta' : 'Autorizada por un tercero';
    }

    /** `2000-01-01` es el centinela de "no consta": parece un dato real y el huso lo corre a "31/12/1999". */
    desde(fecha: string | null): string | null {
        if (!fecha) return null;
        return fecha.startsWith('2000-01-01') ? null : fecha;
    }

    tipoPersona(personType: string): string {
        return personType === 'J' ? 'Jurídica' : 'Natural';
    }

    // Trabajo pendiente de soporte

    cargarSinDocumento(pagina = 0): void {
        this.paginaSinDocumento.set(pagina);
        this.cargandoSinDocumento.set(true);

        this.service.pendientesDeIdentificacion({ page: pagina, recordsByPage: this.tamano })
            .pipe(finalize(() => this.cargandoSinDocumento.set(false)))
            .subscribe({
                next: r => {
                    this.sinDocumento.set(r.body ?? []);
                    this.totalSinDocumento.set(totalDelEncabezado(r.headers));
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar la lista.'),
            });
    }

    cargarSinRespaldo(pagina = 0): void {
        this.paginaSinRespaldo.set(pagina);
        this.cargandoSinRespaldo.set(true);

        this.service.respaldosPendientes({ page: pagina, recordsByPage: this.tamano })
            .pipe(finalize(() => this.cargandoSinRespaldo.set(false)))
            .subscribe({
                next: r => {
                    this.sinRespaldo.set(r.body ?? []);
                    this.totalSinRespaldo.set(totalDelEncabezado(r.headers));
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar la lista.'),
            });
    }

    // Conciliación

    cargarConciliacion(): void {
        this.cargandoConciliacion.set(true);
        this.service.conciliacion()
            .pipe(finalize(() => this.cargandoConciliacion.set(false)))
            .subscribe({
                next: c => this.conciliacion.set(c),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo comprobar la conciliación.'),
            });
    }

    conciliar(): void {
        this.conciliando.set(true);
        this.informe.set(null);

        this.service.conciliar()
            .pipe(finalize(() => this.conciliando.set(false)))
            .subscribe({
                next: i => {
                    this.informe.set(i);
                    this.toastr.success(
                        `${i.cuentasRecorridas} cuentas revisadas, ${i.operacionesSelladas} operaciones selladas.`);
                    this.cargarConciliacion();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo conciliar.'),
            });
    }

    // Comunes

    claseNivel(nivel: string | null | undefined): string {
        switch (nivel) {
            case 'Rojo': return 'per-chip--alta';
            case 'Ambar': return 'per-chip--media';
            default: return 'per-chip--ok';
        }
    }

}
