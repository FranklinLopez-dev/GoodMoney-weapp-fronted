import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { FiscalService, LineaSire, PeriodoSire } from '../fiscal.service';
import { mostrarErrorFiscal } from '../fiscal-comunes';

/**
 * SIRE del Registro de Ventas. SUNAT propone cada mes lo que recibió; aquí se concilia contra lo
 * que emitimos y se acepta. "Emitidos que SUNAT no tiene" es lo que hay que mirar primero.
 */
@Component({
    selector: 'app-fiscal-sire',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    templateUrl: './sire.component.html',
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FiscalSireComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    readonly puedeGestionar = inject(AuthStore).hasPermission(Permission.SireManage);

    readonly configurado = signal<boolean | null>(null);
    readonly periodos = signal<PeriodoSire[]>([]);
    readonly cargando = signal(false);
    readonly ocupado = signal<string | null>(null);

    readonly abierto = signal<PeriodoSire | null>(null);
    readonly cubeta = signal<number | null>(4);
    readonly lineas = signal<LineaSire[]>([]);
    readonly totalLineas = signal(0);
    readonly pagina = signal(0);
    readonly tamano = signal(50);

    readonly cubetas = [
        { valor: 4, nombre: 'Emitidos que SUNAT no tiene', clase: 'cmp-chip--alta' },
        { valor: 2, nombre: 'Difieren', clase: 'cmp-chip--media' },
        { valor: 3, nombre: 'Solo en SUNAT', clase: 'cmp-chip--revisado' },
        { valor: 1, nombre: 'Coinciden', clase: 'cmp-chip--ok' },
    ];

    constructor() {
        this.service.sireEstado().subscribe({ next: e => this.configurado.set(e.configurado), error: () => this.configurado.set(false) });
        this.cargar();
    }

    legible(periodo: string): string { return `${periodo.substring(4, 6)}/${periodo.substring(0, 4)}`; }

    claseEstado(estado: string): string {
        switch (estado) {
            case 'Aceptado': case 'Registrado': return 'cmp-chip--ok';
            case 'Omiso': return 'cmp-chip--alta';
            case 'PropuestaDescargada': return 'cmp-chip--revisado';
            default: return 'cmp-chip--pendiente';
        }
    }

    nombreEstado(estado: string): string {
        switch (estado) {
            case 'SinGestionar': return 'Sin gestionar';
            case 'PropuestaDescargada': return 'Propuesta descargada';
            case 'Omiso': return 'OMISO';
            default: return estado;
        }
    }

    nombreCubeta(c: number): string { return this.cubetas.find(x => x.valor === c)?.nombre ?? ''; }
    claseCubeta(c: number): string { return this.cubetas.find(x => x.valor === c)?.clase ?? 'cmp-chip--baja'; }

    cargar(): void {
        this.cargando.set(true);
        this.service.sirePeriodos().pipe(finalize(() => this.cargando.set(false))).subscribe({
            next: p => {
                this.periodos.set(p ?? []);
                const a = this.abierto();
                if (a) this.abierto.set(p.find(x => x.id === a.id) ?? null);
            },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar los períodos.'),
        });
    }

    private accion(clave: string, llamada: ReturnType<FiscalService['sireSincronizar']>, error: string, alTerminar?: () => void): void {
        this.ocupado.set(clave);
        llamada.pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: r => { this.toastr.success(r.mensaje); this.cargar(); alTerminar?.(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, error),
        });
    }

    probar(): void {
        this.ocupado.set('probar');
        this.service.sireProbar().pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: r => r.ok ? this.toastr.success(`${r.mensaje} ${r.periodos} período(s) en SUNAT.`) : this.toastr.error(r.mensaje),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo probar la conexión.'),
        });
    }

    sincronizar(): void { this.accion('sincronizar', this.service.sireSincronizar(), 'No se pudieron traer los períodos.'); }
    pedirPropuesta(p: PeriodoSire): void { this.accion('p' + p.id, this.service.sirePedirPropuesta(p.id), 'No se pudo pedir la propuesta.'); }
    consultar(p: PeriodoSire): void {
        if (!p.procesoEnCurso) return;
        this.accion('p' + p.id, this.service.sireConsultar(p.procesoEnCurso.id), 'No se pudo consultar el ticket.', () => this.recargarLineas());
    }
    conciliar(p: PeriodoSire): void {
        this.accion('p' + p.id, this.service.sireConciliar(p.id), 'No se pudo conciliar.', () => this.recargarLineas());
    }

    aceptar(p: PeriodoSire): void {
        const hayDiferencias = p.cntSoloSistema > 0 || p.cntDifieren > 0;
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: `Aceptar la propuesta de ${this.legible(p.periodo)}`,
                message: hayDiferencias
                    ? `La conciliación tiene diferencias (${p.cntDifieren} difieren, ${p.cntSoloSistema} emitidos que SUNAT no tiene). ` +
                      'Aceptar cierra el Registro de Ventas del mes TAL COMO LO TIENE SUNAT. Lo recomendable es reenviar primero lo que falta.'
                    : 'Se cierra el Registro de Ventas del mes ante SUNAT con su propuesta. No tiene vuelta atrás desde aquí.',
                confirmText: hayDiferencias ? 'Aceptar igual' : 'Aceptar propuesta',
                color: 'warn',
            },
        }).afterClosed().subscribe(ok => {
            if (ok) this.accion('p' + p.id, this.service.sireAceptar(p.id, hayDiferencias), 'No se pudo aceptar la propuesta.');
        });
    }

    abrir(p: PeriodoSire): void {
        this.abierto.set(p);
        this.cubeta.set(p.cntSoloSistema > 0 ? 4 : p.cntDifieren > 0 ? 2 : null);
        this.pagina.set(0);
        this.recargarLineas();
    }

    cerrar(): void { this.abierto.set(null); }

    filtrar(c: number | null): void { this.cubeta.set(c); this.pagina.set(0); this.recargarLineas(); }

    cambiarPagina(e: PageEvent): void { this.pagina.set(e.pageIndex); this.tamano.set(e.pageSize); this.recargarLineas(); }

    recargarLineas(): void {
        const p = this.abierto();
        if (!p) return;
        this.service.sireLineas(p.id, this.cubeta(), this.pagina() + 1, this.tamano()).subscribe({
            next: r => { this.lineas.set(r.body ?? []); this.totalLineas.set(totalDelEncabezado(r.headers)); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar las líneas.'),
        });
    }
}
