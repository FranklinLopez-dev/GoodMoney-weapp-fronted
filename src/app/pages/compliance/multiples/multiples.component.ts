import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { CasoMultiple, ComplianceService, EntradaBitacora, MultiplesMes } from '../compliance.service';
import { MESES, descargarArchivo, leerArchivoBase64, mostrarError, nombreMes } from '../compliance-comunes';

/**
 * Operaciones múltiples: las de una persona que en el mes suman el umbral acumulado sin que ninguna
 * llegue al individual. No van al archivo del portal (lo rechaza); aquí se documenta cada caso
 * persona-mes: origen de fondos, sustento, conclusión, estado o descarte con motivo, y su bitácora.
 */
@Component({
    selector: 'app-compliance-multiples',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './multiples.component.html',
    styleUrls: ['../_compartido.scss', './multiples.component.scss'],
})
export class ComplianceMultiplesComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private ruta = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthStore);
    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);
    /** "Elevado a ROS" es reservado como el ROS: solo lo ve y lo pone quien ve ROS. */
    readonly veRos = this.auth.hasPermission(Permission.ComplianceRos);
    readonly meses = MESES;
    readonly nombreMes = nombreMes;

    private readonly hoy = new Date();
    // Por defecto el mes anterior: el que se está cerrando.
    readonly anio = signal(new Date(this.hoy.getFullYear(), this.hoy.getMonth() - 1, 1).getFullYear());
    readonly mes = signal(new Date(this.hoy.getFullYear(), this.hoy.getMonth() - 1, 1).getMonth() + 1);
    readonly anios = computed(() => [this.hoy.getFullYear(), this.hoy.getFullYear() - 1, this.hoy.getFullYear() - 2]);

    readonly datos = signal<MultiplesMes | null>(null);
    readonly cargando = signal(false);
    readonly exportando = signal(false);
    private consulta = 0;

    readonly abierto = signal<number | null>(null);   // personId del caso desplegado
    readonly origen = signal('');
    readonly sustento = signal('');
    readonly conclusion = signal('');
    readonly estado = signal<'Pendiente' | 'Revisado' | 'ElevadoARos'>('Pendiente');
    readonly motivoDescarte = signal('');
    readonly guardando = signal(false);

    readonly bitacora = signal<EntradaBitacora[]>([]);
    readonly comentario = signal('');
    readonly adjunto = signal<{ base64: string; nombre: string } | null>(null);

    constructor() {
        this.ruta.queryParamMap.subscribe(p => {
            const anio = Number(p.get('anio'));
            const mes = Number(p.get('mes'));
            if (anio >= 2000 && anio <= 2100) this.anio.set(anio);
            if (mes >= 1 && mes <= 12) this.mes.set(mes);
            this.cargar();
        });
    }

    cambiarMes(): void {
        // Un caso abierto es de un mes: al cambiar, se cierra (si no, el formulario llevaría los
        // datos de otro mes al caso de la misma persona en el nuevo).
        this.abierto.set(null);
        this.router.navigate([], { relativeTo: this.ruta, queryParams: { anio: this.anio(), mes: this.mes() } });
    }

    cargar(): void {
        const esta = ++this.consulta;
        this.cargando.set(true);
        this.service.multiples(this.anio(), this.mes())
            .pipe(finalize(() => { if (esta === this.consulta) this.cargando.set(false); }))
            .subscribe({
                next: d => {
                    if (esta !== this.consulta) return;
                    this.datos.set(d);
                    const abierto = this.abierto();
                    if (abierto !== null) {
                        const c = d.casos.find(x => x.personId === abierto);
                        if (c) this.cargarBitacora(c); else this.abierto.set(null);
                    }
                },
                error: (e: HttpErrorResponse) => { if (esta === this.consulta) mostrarError(this.toastr, e, 'No se pudieron cargar las operaciones múltiples.'); },
            });
    }

    alternar(c: CasoMultiple): void {
        if (this.abierto() === c.personId) { this.abierto.set(null); return; }
        this.abierto.set(c.personId);
        this.origen.set(c.origenFondos ?? '');
        this.sustento.set(c.sustento ?? '');
        this.conclusion.set(c.conclusion ?? '');
        this.estado.set(c.estado);
        this.motivoDescarte.set('');
        this.comentario.set('');
        this.adjunto.set(null);
        this.cargarBitacora(c);
    }

    private consultaBitacora = 0;

    private cargarBitacora(c: CasoMultiple): void {
        const esta = ++this.consultaBitacora;
        if (!c.caseId) { this.bitacora.set([]); return; }
        this.service.bitacora({ multipleId: c.caseId }).subscribe({
            next: b => { if (esta === this.consultaBitacora) this.bitacora.set(b ?? []); },
            error: (e: HttpErrorResponse) => {
                if (esta !== this.consultaBitacora) return;
                this.bitacora.set([]);
                mostrarError(this.toastr, e, 'No se pudo cargar la bitácora.');
            },
        });
    }

    guardar(c: CasoMultiple): void {
        if (this.estado() !== 'Pendiente' && !this.conclusion().trim()) {
            this.toastr.error('Para darlo por revisado o elevarlo a ROS escribe la conclusión: es el sustento.');
            return;
        }
        this.guardando.set(true);
        this.service.revisarMultiple({
            year: this.anio(), month: this.mes(), personId: c.personId,
            origenFondos: this.origen().trim() || null, sustento: this.sustento().trim() || null,
            conclusion: this.conclusion().trim() || null, estado: this.estado(),
        }).pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: () => { this.toastr.success('Análisis guardado.'); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar el análisis.'),
        });
    }

    descartar(c: CasoMultiple, descartar: boolean): void {
        if (descartar && !this.motivoDescarte().trim()) {
            this.toastr.error('Escribe por qué el conjunto no es fraccionamiento: la SBS puede pedir el sustento.');
            return;
        }
        this.guardando.set(true);
        this.service.descartarMultiple({
            year: this.anio(), month: this.mes(), personId: c.personId, descartar, motivo: descartar ? this.motivoDescarte().trim() : null,
        }).pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: () => { this.toastr.success(descartar ? 'Caso descartado.' : 'El caso vuelve a considerarse.'); this.motivoDescarte.set(''); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar.'),
        });
    }

    async alElegirArchivo(evento: Event): Promise<void> {
        const input = evento.target as HTMLInputElement;
        const archivo = input.files?.[0];
        input.value = '';
        if (!archivo) return;
        if (archivo.size > 10 * 1024 * 1024) { this.toastr.error('El archivo supera los 10 MB.'); return; }
        this.adjunto.set(await leerArchivoBase64(archivo));
    }

    agregarComentario(c: CasoMultiple): void {
        const texto = this.comentario().trim();
        const archivo = this.adjunto();
        if (!texto && !archivo) { this.toastr.info('Escribe un comentario o adjunta un documento.'); return; }

        // La bitácora cuelga del caso: si todavía no existe, se abre sin tocar el análisis (guardarlo con
        // lo que había en pantalla pisaría lo que otro oficial acabara de escribir).
        const enviar = (caseId: number) => this.service.agregarBitacora({
            roMultipleCaseId: caseId, text: texto || undefined, fileBase64: archivo?.base64, fileName: archivo?.nombre,
        }).pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: () => { this.comentario.set(''); this.adjunto.set(null); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo guardar la entrada.'),
        });

        this.guardando.set(true);
        if (c.caseId) { enviar(c.caseId); return; }
        this.service.abrirMultiple({ year: this.anio(), month: this.mes(), personId: c.personId }).subscribe({
            next: r => enviar(r.caseId),
            error: (e: HttpErrorResponse) => { this.guardando.set(false); mostrarError(this.toastr, e, 'No se pudo abrir el caso.'); },
        });
    }

    descargarEvidencia(entrada: EntradaBitacora): void {
        this.service.archivoBitacora(entrada.id).subscribe({
            next: b => descargarArchivo(b, entrada.originalName ?? `evidencia-${entrada.id}`),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo descargar el archivo.'),
        });
    }

    exportar(): void {
        this.exportando.set(true);
        this.service.excelMultiples(this.anio(), this.mes()).pipe(finalize(() => this.exportando.set(false))).subscribe({
            next: b => descargarArchivo(b, `OPERACIONES-MULTIPLES-${this.anio()}-${String(this.mes()).padStart(2, '0')}.xlsx`),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo generar el archivo.'),
        });
    }

    nombreEstado(c: CasoMultiple): string {
        if (c.yaNoCalifica) return 'Ya no califica';
        if (c.descartado) return 'Descartado';
        return c.estado === 'ElevadoARos' ? 'Elevado a ROS' : c.estado;
    }

    claseEstado(c: CasoMultiple): string {
        if (c.descartado || c.yaNoCalifica) return 'cmp-chip--baja';
        return c.estado === 'Pendiente' ? 'cmp-chip--pendiente' : c.estado === 'ElevadoARos' ? 'cmp-chip--alta' : 'cmp-chip--ok';
    }
}
