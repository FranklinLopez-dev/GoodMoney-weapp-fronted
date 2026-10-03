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
import {
    Alerta, ComplianceService, EntradaBitacora, OperacionDeAlerta, RiesgoPersona,
} from '../compliance.service';
import {
    claseEstado, claseNivel, claseSeveridad, leerArchivoBase64, mostrarError,
} from '../compliance-comunes';

/** Se calcula por persona: quien fracciona reparte entre varias cuentas y sumando por perfil no se juntaría. */
@Component({
    selector: 'app-compliance-alertas',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './alertas.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceAlertasComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);
    readonly puedeVerRos = this.auth.hasPermission(Permission.ComplianceRos);

    readonly claseSeveridad = claseSeveridad;
    readonly claseEstado = claseEstado;
    readonly claseNivel = claseNivel;

    readonly alertas = signal<Alerta[]>([]);
    readonly cargando = signal(false);
    readonly filtroEstado = signal('Pendiente');
    readonly filtroRegla = signal('');
    readonly filtroSeveridad = signal('');
    readonly busqueda = signal('');
    readonly recalculando = signal(false);

    readonly abierta = signal<Alerta | null>(null);
    readonly operaciones = signal<OperacionDeAlerta[]>([]);
    readonly riesgo = signal<RiesgoPersona | null>(null);
    readonly bitacora = signal<EntradaBitacora[]>([]);

    readonly resultadoRevision = signal('Revisado');
    readonly notaRevision = signal('');
    readonly guardandoRevision = signal(false);

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
        this.service.alertas({
            estado: this.filtroEstado(), regla: this.filtroRegla(),
            severidad: this.filtroSeveridad(), valor: this.busqueda(),
        })
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: a => this.alertas.set(a ?? []),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudieron cargar las alertas.'),
            });
    }

    limpiar(): void {
        this.filtroEstado.set('');
        this.filtroRegla.set('');
        this.filtroSeveridad.set('');
        this.busqueda.set('');
        this.cargar();
    }

    recalcular(): void {
        this.recalculando.set(true);
        this.service.recalcularAlertas()
            .pipe(finalize(() => this.recalculando.set(false)))
            .subscribe({
                next: r => {
                    this.toastr.success(`Se reevaluaron ${r.personas} personas.`);
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo recalcular.'),
            });
    }

    abrir(a: Alerta): void {
        this.abierta.set(a);
        this.resultadoRevision.set(a.status === 'Pendiente' ? 'Revisado' : a.status);
        this.notaRevision.set(a.reviewNote ?? '');
        this.comentario.set('');
        this.adjunto.set(null);

        this.service.operacionesDeAlerta(a.id).subscribe({
            next: o => this.operaciones.set(o ?? []),
            error: () => this.operaciones.set([]),
        });

        this.service.riesgo(a.personId).subscribe({
            next: r => this.riesgo.set(r),
            error: () => this.riesgo.set(null),
        });

        this.recargarBitacora(a.id);
    }

    cerrar(): void {
        this.abierta.set(null);
        this.operaciones.set([]);
        this.riesgo.set(null);
        this.bitacora.set([]);
    }

    private recargarBitacora(alertaId: number): void {
        this.service.bitacora({ alertaId }).subscribe({
            next: b => this.bitacora.set(b ?? []),
            error: () => this.bitacora.set([]),
        });
    }

    guardarRevision(): void {
        const a = this.abierta();
        if (!a) return;

        this.guardandoRevision.set(true);
        this.service.revisarAlerta(a.id, this.resultadoRevision(), this.notaRevision())
            .pipe(finalize(() => this.guardandoRevision.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success('Revisión guardada.');
                    this.recargarBitacora(a.id);
                    this.cargar();
                    this.abierta.set({ ...a, status: this.resultadoRevision(), reviewNote: this.notaRevision() });
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar la revisión.'),
            });
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
        const a = this.abierta();
        if (!a) return;

        const texto = this.comentario().trim();
        const archivo = this.adjunto();

        if (!texto && !archivo) {
            this.toastr.info('Escribe un comentario o adjunta un documento.');
            return;
        }

        this.guardandoComentario.set(true);
        this.service.agregarBitacora({
            complianceAlertId: a.id,
            text: texto || undefined,
            fileBase64: archivo?.base64,
            fileName: archivo?.nombre,
        })
            .pipe(finalize(() => this.guardandoComentario.set(false)))
            .subscribe({
                next: () => {
                    this.comentario.set('');
                    this.adjunto.set(null);
                    this.recargarBitacora(a.id);
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar la entrada.'),
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

    derivarARos(): void {
        const a = this.abierta();
        if (!a) return;

        this.service.abrirExpediente({
            personId: a.personId,
            complianceAlertId: a.id,
            signals: `${a.ruleType}: ${a.operationsCount} operaciones por USD ${a.accumulatedAmountUsd} ` +
                     `en ${a.windowDays} días.`,
        }).subscribe({
            next: () => {
                this.toastr.success('Expediente abierto.');
                this.cargar();
                this.abierta.set({ ...a, hasSuspiciousReport: true });
            },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo abrir el expediente.'),
        });
    }
}
