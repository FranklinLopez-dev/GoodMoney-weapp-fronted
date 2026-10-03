import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceService, RoMensual } from '../compliance.service';
import { MESES, claseEstado, descargarArchivo, mostrarError, nombreMes } from '../compliance-comunes';

/** El mes va en la URL (`?anio=2026&mes=8`) para poder mandar el enlace por chat y que sirva el botón atrás. */
@Component({
    selector: 'app-compliance-ro',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, RouterLink],
    templateUrl: './ro.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceRoComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);
    private router = inject(Router);
    private ruta = inject(ActivatedRoute);

    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);
    readonly claseEstado = claseEstado;
    readonly nombreMes = nombreMes;
    readonly meses = MESES;

    private readonly hoy = new Date();
    readonly anio = signal(this.hoy.getFullYear());
    readonly mes = signal(this.hoy.getMonth() + 1);

    readonly ro = signal<RoMensual | null>(null);
    readonly cargando = signal(false);
    readonly exportando = signal(false);
    readonly recalculando = signal(false);

    readonly filaEnEdicion = signal<number | null>(null);
    readonly edicionOrigen = signal('');
    readonly edicionOcupacion = signal<number | null>(null);
    readonly edicionNacionalidad = signal('');
    readonly guardandoFila = signal(false);

    readonly nota = signal('');

    readonly anios = computed(() => {
        const actual = this.hoy.getFullYear();
        return [actual, actual - 1, actual - 2];
    });

    /** El mes remitido está congelado: ni se completa ni se recalcula. */
    readonly mesCongelado = computed(() => this.ro()?.status === 'Enviado');

    constructor() {
        // De la URL, para que el enlace sea copiable; si no trae mes, el actual.
        this.ruta.queryParamMap.subscribe(p => {
            const anio = Number(p.get('anio'));
            const mes = Number(p.get('mes'));

            if (anio >= 2000 && anio <= 2100) this.anio.set(anio);
            if (mes >= 1 && mes <= 12) this.mes.set(mes);

            this.cargar();
        });
    }

    /** Cambiar de mes navega, para que quede en el historial del navegador. */
    cambiarMes(): void {
        this.router.navigate([], {
            relativeTo: this.ruta,
            queryParams: { anio: this.anio(), mes: this.mes() },
            replaceUrl: false,
        });
    }

    cargar(): void {
        this.cargando.set(true);
        this.filaEnEdicion.set(null);

        this.service.ro(this.anio(), this.mes())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => { this.ro.set(r); this.nota.set(r.note ?? ''); },
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudo cargar el registro del mes.'),
            });
    }

    recalcular(): void {
        this.recalculando.set(true);
        this.service.recalcularRo(this.anio(), this.mes())
            .pipe(finalize(() => this.recalculando.set(false)))
            .subscribe({
                next: r => {
                    if (r.mesCongelado) {
                        this.toastr.info('El mes ya se remitió a la UIF: no se toca.');
                    } else {
                        this.toastr.success(
                            `${r.enElRo} operaciones en el registro (${r.marcadas} nuevas, ${r.desmarcadas} retiradas).`);
                    }
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo recalcular.'),
            });
    }

    editarFila(fila: { operationId: number; origenFondos: string | null; nacionalidad: string | null }): void {
        this.filaEnEdicion.set(fila.operationId);
        this.edicionOrigen.set(fila.origenFondos ?? '');
        this.edicionOcupacion.set(null);
        this.edicionNacionalidad.set(fila.nacionalidad ?? '');
    }

    guardarFila(): void {
        const operationId = this.filaEnEdicion();
        if (!operationId) return;

        this.guardandoFila.set(true);
        this.service.completarFilaRo({
            operationId,
            origenFondos: this.edicionOrigen().trim() || undefined,
            positionId: this.edicionOcupacion() ?? undefined,
            nacionalidad: this.edicionNacionalidad().trim() || undefined,
        })
            .pipe(finalize(() => this.guardandoFila.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success('Fila completada.');
                    this.filaEnEdicion.set(null);
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo completar la fila.'),
            });
    }

    readonly pidiendoDj = signal<number | null>(null);

    pedirDj(operationId: number): void {
        this.pidiendoDj.set(operationId);
        this.service.pedirDj(operationId).pipe(finalize(() => this.pidiendoDj.set(null))).subscribe({
            next: r => this.toastr.success(r.mensaje),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo enviar el enlace.'),
        });
    }

    descargarDj(operationId: number): void {
        this.service.djOperacion(operationId).subscribe({
            next: b => descargarArchivo(b, `DJ-GM-${String(operationId).padStart(8, '0')}.pdf`),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo descargar la declaración jurada.'),
        });
    }

    exportar(): void {
        this.exportando.set(true);
        this.service.excelRo(this.anio(), this.mes())
            .pipe(finalize(() => this.exportando.set(false)))
            .subscribe({
                next: blob => {
                    descargarArchivo(blob,
                        `REGISTRO-OPERACIONES-${nombreMes(this.mes()).toUpperCase()}-${this.anio()}.xlsx`);
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo generar el archivo.'),
            });
    }

    marcarEstado(status: string): void {
        // Marcar "Enviado" congela el mes: el recálculo deja de tocarlo y las filas ya no se pueden completar.
        if (status === 'Enviado' &&
            !confirm('Al marcarlo como remitido el mes queda congelado: no se podrán completar filas ' +
                     'ni recalcular el registro. ¿Ya lo cargaste en el portal PLAFT?')) {
            return;
        }

        this.service.estadoRo(this.anio(), this.mes(), status, this.nota())
            .subscribe({
                next: () => { this.toastr.success('Estado actualizado.'); this.cargar(); },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cambiar el estado.'),
            });
    }
}
