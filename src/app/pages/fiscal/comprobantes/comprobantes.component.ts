import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { finalize, skip } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Comprobante, EntradaHistorial, FiscalService, ResumenFiscal } from '../fiscal.service';
import {
    ESTADOS_COMPROBANTE, TIPOS_COMPROBANTE, claseEstadoComprobante, descargarArchivo, fechaParaApi, mostrarErrorFiscal,
} from '../fiscal-comunes';

/**
 * Bandeja de comprobantes electrónicos: lo emitido, lo que no llega a SUNAT y por qué, y las
 * acciones sobre cada uno. Anular no se hace aquí directamente: se SOLICITA y otra persona aprueba.
 */
@Component({
    selector: 'app-fiscal-comprobantes',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './comprobantes.component.html',
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FiscalComprobantesComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);
    private dialog = inject(MatDialog);

    readonly puedeGestionar = this.auth.hasPermission(Permission.FiscalManage);
    readonly puedeAnular = this.auth.hasPermission(Permission.FiscalAnular);

    readonly estados = ESTADOS_COMPROBANTE;
    readonly tipos = TIPOS_COMPROBANTE;
    readonly claseEstado = claseEstadoComprobante;

    readonly resumen = signal<ResumenFiscal | null>(null);
    readonly comprobantes = signal<Comprobante[]>([]);
    readonly total = signal(0);
    readonly cargando = signal(false);
    readonly ocupado = signal<number | null>(null);

    readonly desde = signal<Date | null>(null);
    readonly hasta = signal<Date | null>(null);
    readonly estado = signal<number | null>(null);
    readonly tipo = signal<number | null>(null);
    readonly texto = signal('');
    readonly pagina = signal(0);
    readonly tamano = signal(20);

    readonly abierto = signal<Comprobante | null>(null);
    readonly historial = signal<EntradaHistorial[]>([]);

    // Solicitud de anulación
    readonly motivosNc = signal<{ codigo: string; descripcion: string }[]>([]);
    readonly accion = signal<'baja' | 'notacredito'>('notacredito');
    readonly codigoNota = signal('01');
    readonly motivo = signal('');
    readonly reemitirTrasAnular = signal(false);
    readonly solicitando = signal(false);

    constructor() {
        this.cargar();
        toObservable(this.texto)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => { this.pagina.set(0); this.cargar(); });
        this.service.motivosNotaCredito().subscribe({ next: m => this.motivosNc.set(m ?? []), error: () => {} });
    }

    cargar(): void {
        this.service.resumen().subscribe({ next: r => this.resumen.set(r), error: () => {} });
        this.cargando.set(true);
        this.service.comprobantes({
            desde: fechaParaApi(this.desde()), hasta: fechaParaApi(this.hasta()),
            estado: this.estado(), tipo: this.tipo(), texto: this.texto().trim() || null,
            page: this.pagina() + 1, recordsByPage: this.tamano(),
        })
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => {
                    this.comprobantes.set(r.body ?? []);
                    this.total.set(totalDelEncabezado(r.headers));
                },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar los comprobantes.'),
            });
    }

    filtrarPorEstado(estado: number | null): void {
        this.estado.set(estado);
        this.pagina.set(0);
        this.cargar();
    }

    limpiar(): void {
        this.desde.set(null);
        this.hasta.set(null);
        this.estado.set(null);
        this.tipo.set(null);
        this.texto.set('');
        this.pagina.set(0);
        this.cargar();
    }

    cambiarPagina(e: PageEvent): void {
        this.pagina.set(e.pageIndex);
        this.tamano.set(e.pageSize);
        this.cargar();
    }

    // Descargas

    pdf(c: Comprobante, formato: 'A4' | 'Ticket'): void {
        this.service.pdf(c.id, formato).subscribe({
            next: b => descargarArchivo(b, `${c.numeroCompleto}${formato === 'Ticket' ? '-ticket' : ''}.pdf`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo generar el PDF.'),
        });
    }

    xml(c: Comprobante): void {
        this.service.xml(c.id).subscribe({
            next: b => descargarArchivo(b, `${c.numeroCompleto}.xml`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo descargar el XML.'),
        });
    }

    cdr(c: Comprobante): void {
        this.service.cdr(c.id).subscribe({
            next: b => descargarArchivo(b, `R-${c.numeroCompleto}.zip`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo descargar la constancia.'),
        });
    }

    // Acciones ante SUNAT

    private accionar(c: Comprobante, llamada: ReturnType<FiscalService['enviar']>, error: string): void {
        this.ocupado.set(c.id);
        llamada.pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: r => {
                this.toastr.success(r.mensaje);
                this.cargar();
                if (this.abierto()?.id === c.id) this.cerrar();
            },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, error),
        });
    }

    enviar(c: Comprobante): void {
        this.accionar(c, this.service.enviar(c.id), 'No se pudo enviar a SUNAT.');
    }

    reemitir(c: Comprobante): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Reemitir comprobante',
                message: `SUNAT rechazó ${c.numeroCompleto}. Se emitirá un comprobante NUEVO para la operación ` +
                         `${c.codigoOperacion} con los datos actuales del cliente. Corrígelos antes si hace falta.`,
                confirmText: 'Reemitir',
            },
        }).afterClosed().subscribe(ok => {
            if (ok) this.accionar(c, this.service.reemitir(c.id), 'No se pudo reemitir.');
        });
    }

    declararResumen(c: Comprobante): void {
        this.accionar(c, this.service.declararResumen(c.id), 'No se pudo declarar en el resumen.');
    }

    verificarBaja(c: Comprobante): void {
        this.accionar(c, this.service.verificarBaja(c.id), 'No se pudo consultar la baja.');
    }

    // Detalle

    abrir(c: Comprobante): void {
        this.abierto.set(c);
        this.historial.set([]);
        this.accion.set(c.puedeDarDeBaja ? 'baja' : 'notacredito');
        this.codigoNota.set('01');
        this.motivo.set('');
        this.reemitirTrasAnular.set(false);
        this.service.historial(c.id).subscribe({ next: h => this.historial.set(h ?? []), error: () => {} });
    }

    cerrar(): void {
        this.abierto.set(null);
    }

    private static readonly ACCIONES: Record<string, string> = {
        Emitir: 'Emisión',
        Envio: 'Envío a SUNAT',
        Rechazo: 'Rechazado por SUNAT',
        NotaCredito: 'Nota de crédito',
        Baja: 'Baja enviada',
        BajaConfirmada: 'Baja aceptada',
        BajaRechazada: 'Baja rechazada',
        Reasignar: 'Reemplazado',
        ReemisionFallida: 'Reemisión fallida',
        Resumen: 'Resumen diario',
    };

    /** La auditoría guarda un código; aquí se lee. */
    nombreAccion(accion: string): string { return FiscalComprobantesComponent.ACCIONES[accion] ?? accion; }

    observaciones(c: Comprobante): string[] {
        try { return c.observacionesSunat ? JSON.parse(c.observacionesSunat) : []; } catch { return []; }
    }

    solicitarAnulacion(): void {
        const c = this.abierto();
        if (!c) return;
        if (!this.motivo().trim()) {
            this.toastr.info('Escribe el motivo de la anulación.');
            return;
        }
        this.solicitando.set(true);
        this.service.solicitarAnulacion({
            comprobanteId: c.id,
            accion: this.accion(),
            codigoTipoNota: this.accion() === 'notacredito' ? this.codigoNota() : null,
            motivo: this.motivo().trim(),
            reemitir: this.reemitirTrasAnular(),
        })
            .pipe(finalize(() => this.solicitando.set(false)))
            .subscribe({
                next: r => {
                    this.toastr.success(r.mensaje);
                    this.cerrar();
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo registrar la solicitud.'),
            });
    }
}
