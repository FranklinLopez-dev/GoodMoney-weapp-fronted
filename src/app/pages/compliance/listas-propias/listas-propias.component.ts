import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { finalize, skip } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import {
    ComplianceService, FilaListaPropia, ListaPropiaEntrada, ListaPropiaResumen, ResultadoCargaLista, TipoListaPropia,
} from '../compliance.service';
import { descargarArchivo, leerArchivoBase64, mostrarError } from '../compliance-comunes';

/**
 * Listas propias del oficial: PEP, Noticias LAFT, Relacionados LAFT y OFAC de carga manual. Se
 * cargan desde Excel (o una a una), se dan de baja con motivo y cruzan contra la cartera: la PEP
 * por documento; las demás por nombre exacto y por documento cuando lo traen.
 */
@Component({
    selector: 'app-compliance-listas-propias',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './listas-propias.component.html',
    styleUrls: ['../_compartido.scss', './listas-propias.component.scss'],
})
export class ComplianceListasPropiasComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    readonly puedeCargar = inject(AuthStore).hasPermission(Permission.ComplianceReview);

    readonly resumen = signal<ListaPropiaResumen[]>([]);
    readonly tipo = signal<TipoListaPropia>('PEP');
    readonly nombreTipo = computed(() => this.resumen().find(r => r.tipoLista === this.tipo())?.nombre ?? this.tipo());
    readonly esPep = computed(() => this.tipo() === 'PEP');
    readonly llevaDelito = computed(() => this.tipo() === 'NoticiasLaft' || this.tipo() === 'RelacionadosLaft');

    readonly buscar = signal('');
    readonly activas = signal<boolean | null>(true);
    readonly entradas = signal<ListaPropiaEntrada[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(0);
    readonly tamano = signal(50);
    readonly cargando = signal(false);

    /** Qué panel está abierto debajo de la barra: ninguno, la carga de Excel o el alta de una entrada. */
    readonly panel = signal<'' | 'carga' | 'alta'>('');
    readonly archivo = signal<File | null>(null);
    readonly reemplazar = signal(false);
    readonly motivoReemplazo = signal('');
    readonly subiendo = signal(false);
    readonly resultadoCarga = signal<ResultadoCargaLista | null>(null);

    readonly nueva = signal<FilaListaPropia>({});
    readonly guardando = signal(false);

    readonly enBaja = signal<number | null>(null);
    readonly motivoBaja = signal('');

    constructor() {
        this.cargarResumen();
        this.cargar();
        toObservable(this.buscar)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => { this.pagina.set(0); this.cargar(); });
    }

    cargarResumen(): void {
        this.service.listasPropiasResumen().subscribe({
            next: r => this.resumen.set(r ?? []),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar el resumen de las listas.'),
        });
    }

    elegir(tipo: TipoListaPropia): void {
        if (this.tipo() === tipo) return;
        this.tipo.set(tipo);
        this.panel.set('');
        this.resultadoCarga.set(null);
        this.pagina.set(0);
        this.cargar();
    }

    /** mat-select no muestra una opción con valor null: el filtro va como texto. */
    readonly estadoFiltro = computed(() => this.activas() === null ? 'todas' : this.activas() ? 'activas' : 'baja');

    filtrarEstado(valor: 'activas' | 'baja' | 'todas'): void {
        this.activas.set(valor === 'todas' ? null : valor === 'activas');
        this.pagina.set(0);
        this.cargar();
    }

    cambiarPagina(e: PageEvent): void { this.pagina.set(e.pageIndex); this.tamano.set(e.pageSize); this.cargar(); }

    /** Cada carga lleva su número: si llega tarde la de otra pestaña o búsqueda, se descarta. */
    private consulta = 0;

    cargar(): void {
        const esta = ++this.consulta;
        this.cargando.set(true);
        this.service.listaPropia(this.tipo(), {
            buscar: this.buscar().trim(), activas: this.activas(), pagina: this.pagina() + 1, tamano: this.tamano(),
        }).pipe(finalize(() => this.cargando.set(false))).subscribe({
            next: r => {
                if (esta !== this.consulta) return;
                this.entradas.set(r.body ?? []);
                this.total.set(totalDelEncabezado(r.headers));
            },
            error: (e: HttpErrorResponse) => { if (esta === this.consulta) mostrarError(this.toastr, e, 'No se pudo cargar la lista.'); },
        });
    }

    abrir(panel: 'carga' | 'alta'): void {
        this.panel.set(this.panel() === panel ? '' : panel);
        this.resultadoCarga.set(null);
        if (panel === 'alta') this.nueva.set({});
    }

    // ── Excel

    plantilla(): void {
        this.service.plantillaListaPropia(this.tipo()).subscribe({
            next: b => descargarArchivo(b, `plantilla-${this.tipo()}.xlsx`),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo descargar la plantilla.'),
        });
    }

    exportar(): void {
        const activas = this.activas();
        const sufijo = activas === null ? '-historico' : activas ? '' : '-bajas';
        this.service.exportarListaPropia(this.tipo(), activas).subscribe({
            next: b => descargarArchivo(b, `${this.tipo()}${sufijo}.xlsx`),
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo exportar la lista.'),
        });
    }

    elegirArchivo(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        this.archivo.set(input.files?.[0] ?? null);
        // Se vacía el input: si no, volver a elegir el mismo archivo tras una carga no dispara el cambio.
        input.value = '';
    }

    async subir(): Promise<void> {
        const archivo = this.archivo();
        if (!archivo) { this.toastr.info('Elige el archivo Excel de la lista.'); return; }
        if (this.reemplazar() && !this.motivoReemplazo().trim()) {
            this.toastr.error('Para reemplazar la lista vigente escribe el motivo: queda en cada entrada dada de baja.');
            return;
        }

        this.subiendo.set(true);
        try {
            const { base64 } = await leerArchivoBase64(archivo);
            this.service.importarListaPropia(this.tipo(), base64, this.reemplazar(), this.motivoReemplazo().trim() || null)
                .pipe(finalize(() => this.subiendo.set(false)))
                .subscribe({
                    next: r => {
                        this.resultadoCarga.set(r);
                        this.toastr.success(`${r.importadas} entrada(s) cargadas en ${this.nombreTipo()}.`);
                        this.archivo.set(null);
                        this.reemplazar.set(false);
                        this.motivoReemplazo.set('');
                        this.cargarResumen();
                        this.cargar();
                    },
                    error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar el archivo.'),
                });
        } catch {
            this.subiendo.set(false);
            this.toastr.error('No se pudo leer el archivo.');
        }
    }

    // ── Alta de una entrada

    fijar<K extends keyof FilaListaPropia>(campo: K, valor: FilaListaPropia[K]): void {
        this.nueva.update(f => ({ ...f, [campo]: valor }));
    }

    guardarNueva(): void {
        const f = this.nueva();
        if (this.esPep() && !f.numberDocument?.trim()) {
            this.toastr.error('La lista PEP cruza por documento: el número es obligatorio.');
            return;
        }
        if (!f.nombreCompleto?.trim() && !f.numberDocument?.trim()) {
            this.toastr.error('Escribe al menos el nombre o el número de documento.');
            return;
        }

        this.guardando.set(true);
        this.service.agregarAListaPropia(this.tipo(), f).pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: r => {
                if (r.actualizadas > 0) this.toastr.info('La persona ya estaba en la lista: se actualizó con estos datos.');
                else this.toastr.success('Entrada agregada.');
                this.panel.set('');
                this.cargarResumen();
                this.cargar();
            },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo agregar la entrada.'),
        });
    }

    // ── Baja y reactivación

    pedirBaja(e: ListaPropiaEntrada): void { this.enBaja.set(e.id); this.motivoBaja.set(''); }

    confirmarBaja(e: ListaPropiaEntrada): void {
        if (!this.motivoBaja().trim()) { this.toastr.error('Escribe el motivo de la baja: tiene que quedar justificada.'); return; }
        this.service.darDeBajaListaPropia(e.id, this.motivoBaja().trim()).subscribe({
            next: () => { this.toastr.success('Entrada dada de baja.'); this.enBaja.set(null); this.cargarResumen(); this.cargar(); },
            error: (err: HttpErrorResponse) => mostrarError(this.toastr, err, 'No se pudo dar de baja.'),
        });
    }

    reactivar(e: ListaPropiaEntrada): void {
        this.service.reactivarListaPropia(e.id).subscribe({
            next: () => { this.toastr.success('Entrada reactivada.'); this.cargarResumen(); this.cargar(); },
            error: (err: HttpErrorResponse) => mostrarError(this.toastr, err, 'No se pudo reactivar.'),
        });
    }

    detalle(e: ListaPropiaEntrada): string {
        const partes = e.tipoLista === 'PEP' ? [e.cargo, e.entidad] : [e.delito];
        return partes.filter(x => !!x).join(' · ') || '—';
    }
}
