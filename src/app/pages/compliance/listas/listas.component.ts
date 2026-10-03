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
    Coincidencia, CoincidenciaLista, ComplianceService, EstadoIa, EstadoLista,
} from '../compliance.service';
import { claseEstado, mostrarError } from '../compliance-comunes';

/** Cruce contra listas restrictivas (ONU, OFAC, UE): estado, cola de coincidencias y consulta manual. */
@Component({
    selector: 'app-compliance-listas',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './listas.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceListasComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);
    readonly claseEstado = claseEstado;

    readonly estado = signal<EstadoLista[]>([]);
    readonly cargandoEstado = signal(false);
    readonly actualizando = signal(false);

    readonly coincidencias = signal<Coincidencia[]>([]);
    readonly cargandoCola = signal(false);
    readonly filtroEstado = signal('Pendiente');
    readonly filtroFuente = signal('');
    readonly busqueda = signal('');

    readonly enRevision = signal<Coincidencia | null>(null);
    readonly resultado = signal('Descartado');
    readonly nota = signal('');
    readonly guardando = signal(false);

    readonly ia = signal<EstadoIa | null>(null);
    readonly analizando = signal<number | null>(null);

    readonly consultaNombre = signal('');
    readonly consultaDocumento = signal('');
    readonly consultando = signal(false);
    readonly resultadoConsulta = signal<CoincidenciaLista[] | null>(null);

    constructor() {
        this.cargarEstado();
        this.cargarCola();
        // Sin IA el botón no aparece: no hace falta avisar de nada si falla.
        this.service.estadoIa().subscribe({ next: e => this.ia.set(e), error: () => this.ia.set(null) });

        toObservable(this.busqueda)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargarCola());
    }

    // estado de las listas

    cargarEstado(): void {
        this.cargandoEstado.set(true);
        this.service.estadoListas()
            .pipe(finalize(() => this.cargandoEstado.set(false)))
            .subscribe({
                next: e => this.estado.set(e ?? []),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudo consultar el estado de las listas.'),
            });
    }

    /** Una lista de hace más de dos días ya no protege de lo que salió ayer. */
    estaVieja(e: EstadoLista): boolean {
        return e.diasDesdeUltimaOk == null || e.diasDesdeUltimaOk > 2;
    }

    actualizar(): void {
        this.actualizando.set(true);
        this.service.actualizarListas()
            .pipe(finalize(() => this.actualizando.set(false)))
            .subscribe({
                next: r => this.toastr.info(r.mensaje, undefined, { timeOut: 9000 }),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudo encolar la actualización.'),
            });
    }

    // cola de coincidencias

    cargarCola(): void {
        this.cargandoCola.set(true);
        this.service.coincidencias({
            estado: this.filtroEstado(), fuente: this.filtroFuente(), valor: this.busqueda(),
        })
            .pipe(finalize(() => this.cargandoCola.set(false)))
            .subscribe({
                next: c => this.coincidencias.set(c ?? []),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudieron cargar las coincidencias.'),
            });
    }

    revisar(c: Coincidencia): void {
        this.enRevision.set(c);
        this.resultado.set(c.status === 'Pendiente' ? 'Descartado' : c.status);
        this.nota.set(c.reviewNote ?? '');
    }

    guardarRevision(): void {
        const c = this.enRevision();
        if (!c) return;

        if (!this.nota().trim()) {
            this.toastr.error('Escribe por qué se descarta o se confirma: es el sustento de la decisión.');
            return;
        }

        this.guardando.set(true);
        this.service.revisarCoincidencia(c.id, this.resultado(), this.nota().trim())
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: r => {
                    this.toastr.success('Coincidencia revisada.');
                    if (r?.listaNegra) this.toastr.info(r.listaNegra, 'Lista negra', { timeOut: 8000 });
                    this.enRevision.set(null);
                    this.cargarCola();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar la revisión.'),
            });
    }

    // análisis con IA

    analizarIa(c: Coincidencia): void {
        this.analizando.set(c.id);
        this.service.analizarCoincidenciaIa(c.id)
            .pipe(finalize(() => this.analizando.set(null)))
            .subscribe({
                next: r => {
                    // Sobre la fila ACTUAL, no sobre la de cuando se pidió: si mientras tanto se guardó la
                    // revisión y se recargó la cola, no se le devuelve el estado viejo.
                    const conIa = (x: Coincidencia): Coincidencia => ({
                        ...x, iaVeredicto: r.veredicto, iaConfianza: r.confianza, iaAnalisis: r.analisis,
                        iaModelo: r.modelo, iaFecha: r.fecha,
                    });
                    this.coincidencias.update(lista => lista.map(x => x.id === c.id ? conIa(x) : x));
                    const abierta = this.enRevision();
                    if (abierta?.id === c.id) this.enRevision.set(conIa(abierta));
                    this.ia.update(e => e ? { ...e, restantesHoy: r.restantesHoy } : e);
                },
                error: (e: HttpErrorResponse) => {
                    mostrarError(this.toastr, e, 'No se pudo obtener el análisis de la IA.');
                    // Una fallida también gasta: se vuelve a leer lo que queda.
                    this.service.estadoIa().subscribe({ next: x => this.ia.set(x), error: () => {} });
                },
            });
    }

    rotuloIa(v: Coincidencia['iaVeredicto']): string {
        switch (v) {
            case 'FalsoPositivo': return 'Falso positivo';
            case 'PosibleCoincidencia': return 'Posible coincidencia';
            case 'CoincidenciaProbable': return 'Coincidencia probable';
            default: return 'Sin veredicto';
        }
    }

    claseIa(v: Coincidencia['iaVeredicto']): string {
        return v === 'FalsoPositivo' ? 'cmp-chip--ok' : v === 'CoincidenciaProbable' ? 'cmp-chip--alta'
            : v === 'PosibleCoincidencia' ? 'cmp-chip--media' : 'cmp-chip--baja';
    }

    // consulta manual

    consultar(): void {
        if (!this.consultaNombre().trim() && !this.consultaDocumento().trim()) {
            this.toastr.info('Escribe un nombre o un número de documento.');
            return;
        }

        this.consultando.set(true);
        this.resultadoConsulta.set(null);

        this.service.consultarListas(this.consultaNombre(), this.consultaDocumento())
            .pipe(finalize(() => this.consultando.set(false)))
            .subscribe({
                next: r => this.resultadoConsulta.set(r ?? []),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo consultar.'),
            });
    }

    /** "Documento" es certeza; "DocumentoRevisar" coincide el número pero no el nombre: no son únicos entre países. */
    explicarCoincidencia(tipo: string): string {
        switch (tipo) {
            case 'Documento': return 'Coincide el documento y el nombre lo corrobora';
            case 'DocumentoRevisar': return 'Coincide el número, pero el nombre no se parece';
            case 'NombreExacto': return 'Nombre o alias idéntico';
            default: return 'Nombre parecido';
        }
    }
}
