import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceService, EntradaBitacora, Expediente } from '../compliance.service';
import { claseEstado, descargarArchivo, leerArchivoBase64, mostrarError } from '../compliance-comunes';

/** Permiso propio (`compliance.ros`): hay deber de reserva, y saber que existe un expediente ya es saber demasiado. */
@Component({
    selector: 'app-compliance-ros',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './ros.component.html',
    styleUrls: ['../_compartido.scss'],
    styles: ['.ros-pdf { margin-left: auto; }'],
})
export class ComplianceRosComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);
    readonly claseEstado = claseEstado;

    readonly expedientes = signal<Expediente[]>([]);
    readonly cargando = signal(false);
    readonly filtroEstado = signal('');
    readonly busqueda = signal('');

    readonly abierto = signal<Expediente | null>(null);
    readonly bitacora = signal<EntradaBitacora[]>([]);
    readonly analisis = signal('');
    readonly senales = signal('');
    readonly codigoUif = signal('');
    readonly guardando = signal(false);
    readonly descargandoPdf = signal(false);

    readonly comentario = signal('');
    readonly adjunto = signal<{ base64: string; nombre: string } | null>(null);
    readonly guardandoComentario = signal(false);

    constructor() {
        this.cargar();

        toObservable(this.busqueda)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargar());
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.expedientes({ estado: this.filtroEstado(), valor: this.busqueda() })
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: e => this.expedientes.set(e ?? []),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudieron cargar los expedientes.'),
            });
    }

    abrir(e: Expediente): void {
        this.abierto.set(e);
        this.analisis.set(e.analysis ?? '');
        this.senales.set(e.signals ?? '');
        this.codigoUif.set(e.uifCode ?? '');
        this.comentario.set('');
        this.adjunto.set(null);
        this.recargarBitacora(e.id);
    }

    cerrar(): void {
        this.abierto.set(null);
        this.bitacora.set([]);
    }

    private recargarBitacora(rosId: number): void {
        this.service.bitacora({ rosId }).subscribe({
            next: b => this.bitacora.set(b ?? []),
            error: () => this.bitacora.set([]),
        });
    }

    guardar(status: string): void {
        const e = this.abierto();
        if (!e) return;

        this.guardando.set(true);
        this.service.actualizarExpediente({
            id: e.id, status,
            analysis: this.analisis(), signals: this.senales(),
            uifCode: this.codigoUif() || undefined,
        })
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success('Expediente actualizado.');
                    this.cerrar();
                    this.cargar();
                },
                error: (err: HttpErrorResponse) =>
                    mostrarError(this.toastr, err, 'No se pudo actualizar el expediente.'),
            });
    }

    /** Cerrado = ya no admite cambios; si hay hechos nuevos se abre otro. */
    estaCerrado(e: Expediente): boolean {
        return e.status === 'Remitido' || e.status === 'Desestimado';
    }

    async alElegirArchivo(evento: Event): Promise<void> {
        const input = evento.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        if (archivo.size > 10 * 1024 * 1024) {
            this.toastr.error('El archivo supera los 10 MB.');
            input.value = '';
            return;
        }

        this.adjunto.set(await leerArchivoBase64(archivo));
    }

    agregarComentario(): void {
        const e = this.abierto();
        if (!e) return;

        const texto = this.comentario().trim();
        const archivo = this.adjunto();

        if (!texto && !archivo) {
            this.toastr.info('Escribe un comentario o adjunta un documento.');
            return;
        }

        this.guardandoComentario.set(true);
        this.service.agregarBitacora({
            suspiciousReportId: e.id,
            text: texto || undefined,
            fileBase64: archivo?.base64,
            fileName: archivo?.nombre,
        })
            .pipe(finalize(() => this.guardandoComentario.set(false)))
            .subscribe({
                next: () => {
                    this.comentario.set('');
                    this.adjunto.set(null);
                    this.recargarBitacora(e.id);
                },
                error: (err: HttpErrorResponse) =>
                    mostrarError(this.toastr, err, 'No se pudo guardar la entrada.'),
            });
    }

    /** El PDF sale de lo guardado: si hay cambios a medio escribir, se avisa en vez de callarlo. */
    descargarPdf(e: Expediente): void {
        if (this.analisis() !== (e.analysis ?? '') || this.senales() !== (e.signals ?? ''))
            this.toastr.info('El PDF refleja lo guardado. Guarda antes si quieres que incluya lo que acabas de escribir.');
        this.descargandoPdf.set(true);
        this.service.expedientePdf(e.id)
            .pipe(finalize(() => this.descargandoPdf.set(false)))
            .subscribe({
                next: b => descargarArchivo(b, `expediente-ros-${e.id}.pdf`),
                error: (err: HttpErrorResponse) => mostrarError(this.toastr, err, 'No se pudo generar el PDF.'),
            });
    }

    descargarEvidencia(entrada: EntradaBitacora): void {
        this.service.archivoBitacora(entrada.id).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = entrada.originalName ?? `evidencia-${entrada.id}`;
                enlace.click();
                URL.revokeObjectURL(url);
            },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo descargar el archivo.'),
        });
    }
}
