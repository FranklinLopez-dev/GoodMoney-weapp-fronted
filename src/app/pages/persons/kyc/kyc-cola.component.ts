import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { MaterialModule } from 'src/app/material.module';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';
import { KycColaItem, KycFicha, KycService, ESTADOS_KYC } from './kyc.service';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

/**
 * La cola KYC: quién falta validar, con las reglas de su última evaluación, sus documentos y el historial.
 * Validar, observar y suspender lo decide una persona (persons.manage); la evaluación solo ordena el trabajo.
 */
@Component({
    selector: 'app-kyc-cola',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './kyc-cola.component.html',
    styleUrls: ['../persons.component.scss', './kyc-cola.component.scss'],
})
export class KycColaComponent {

    private service = inject(KycService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    private auth = inject(AuthStore);

    readonly puedeDecidir = this.auth.hasPermission(Permission.KycManage);
    readonly estados = ESTADOS_KYC;
    readonly pestanas = ['pendientes', 'en_revision', 'observado', 'vencido', 'validado', 'suspendido', 'sin_validar', 'todos'];

    readonly resumen = signal<Record<string, number>>({});
    readonly estado = signal('pendientes');
    readonly busqueda = signal('');
    readonly items = signal<KycColaItem[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(0);
    readonly tamano = signal(25);
    readonly cargando = signal(false);

    readonly ficha = signal<KycFicha | null>(null);
    readonly cargandoFicha = signal(false);
    readonly ocupado = signal<string | null>(null);
    readonly nota = signal('');

    constructor() {
        this.cargarResumen();
        this.cargar();
    }

    nombreEstado(e: string): string {
        return this.estados[e] || e;
    }

    rotulo(e: string): string {
        if (e === 'pendientes') return 'Por revisar';
        if (e === 'todos') return 'Todos';
        return this.estados[e] ?? e;
    }

    conteo(e: string): number | null {
        const r = this.resumen();
        if (e === 'todos') return Object.values(r).reduce((a, b) => a + b, 0);
        if (e === 'pendientes') return (r['en_revision'] ?? 0) + (r['observado'] ?? 0) + (r['vencido'] ?? 0);
        return r[e] ?? 0;
    }

    claseEstado(e: string): string {
        return e === 'validado' ? 'kyc-chip--ok' : e === 'suspendido' || e === 'vencido' ? 'kyc-chip--alta'
            : e === 'observado' || e === 'en_revision' ? 'kyc-chip--media' : 'kyc-chip--baja';
    }

    claseRegla(e: string): string {
        return e === 'ok' ? 'kyc-chip--ok' : e === 'falla' ? 'kyc-chip--alta' : 'kyc-chip--media';
    }

    cargarResumen(): void {
        this.service.resumen().subscribe({ next: r => this.resumen.set(r), error: () => {} });
    }

    elegirEstado(e: string): void {
        this.estado.set(e);
        this.pagina.set(0);
        this.cargar();
    }

    cambiarPagina(e: PageEvent): void {
        this.pagina.set(e.pageIndex);
        this.tamano.set(e.pageSize);
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.cola(this.estado(), this.busqueda(), this.pagina(), this.tamano())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => {
                    this.items.set(r.body ?? []);
                    this.total.set(totalDelEncabezado(r.headers));
                },
                error: () => this.items.set([]),
            });
    }

    abrir(personId: number): void {
        this.cargandoFicha.set(true);
        this.nota.set('');
        this.service.ficha(personId)
            .pipe(finalize(() => this.cargandoFicha.set(false)))
            .subscribe({ next: f => this.ficha.set(f), error: () => this.ficha.set(null) });
    }

    cerrar(): void {
        this.ficha.set(null);
        this.cargar();
        this.cargarResumen();
    }

    evaluar(): void {
        const f = this.ficha();
        if (!f) return;
        this.ocupado.set('evaluar');
        this.service.evaluar(f.persona.personId)
            .pipe(finalize(() => this.ocupado.set(null)))
            .subscribe({
                next: () => this.abrir(f.persona.personId),
                error: (e: HttpErrorResponse) => this.error(e, 'No se pudo evaluar.'),
            });
    }

    /** La última evaluación tiene una falla: validar no va a pasar hasta corregirla. */
    tieneFallas(): boolean {
        return (this.ficha()?.reglasUltimaEvaluacion ?? []).some(r => r.estado === 'falla');
    }

    suspender(): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Suspender',
                message: 'La persona no podrá operar mientras esté suspendida (si la exigencia de KYC está activa). ¿Continuar?',
                confirmText: 'Suspender', cancelText: 'Cancelar',
            },
        }).afterClosed().subscribe(ok => { if (ok) this.decidir('Suspender'); });
    }

    decidir(accion: 'Validar' | 'Observar' | 'Suspender'): void {
        const f = this.ficha();
        if (!f) return;
        this.ocupado.set(accion);
        this.service.decidir(f.persona.personId, accion, this.nota().trim() || null)
            .pipe(finalize(() => this.ocupado.set(null)))
            .subscribe({
                next: () => {
                    this.toastr.success(accion === 'Validar' ? 'Persona validada.' : accion === 'Observar' ? 'Observación registrada.' : 'Persona suspendida.');
                    this.abrir(f.persona.personId);
                },
                error: (e: HttpErrorResponse) => this.error(e, 'No se pudo guardar la decisión.'),
            });
    }

    verDocumento(documentId: number, nombre: string): void {
        const f = this.ficha();
        if (!f) return;
        this.service.documento(f.persona.personId, documentId).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                this.dialog.open(FileViewerDialogComponent, {
                    data: { name: nombre, type: blob.type === 'application/pdf' ? 'PDF' : 'PNG', url },
                    panelClass: 'file-viewer-dialog', maxWidth: '90vw', maxHeight: '90vh',
                }).afterClosed().subscribe(() => URL.revokeObjectURL(url));
            },
            error: () => {},
        });
    }

    /** El interceptor ya avisa de cualquier error del API (con su texto): aquí no se repite. */
    private error(_e: HttpErrorResponse, _porDefecto: string): void {}
}
