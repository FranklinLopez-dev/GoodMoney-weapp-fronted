import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ExchangeAlertService, ExchangeRateAlert, TipoAlerta } from './exchange-alert.service';
import { ExchangeRateService } from '../../settings/exchange-rates/exchange-rate.service';
import { ExchangeRate } from 'src/app/core/models';

/** El precio arranca un paso hacia el lado que le conviene al cliente: en el de hoy saltaría con el siguiente TC. */
@Component({
    selector: 'app-account-exchange-alert',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule],
    templateUrl: './account-exchange-alert.component.html',
    styleUrls: ['./account-exchange-alert.component.scss'],
})
export class AccountExchangeAlertComponent {

    private service = inject(ExchangeAlertService);
    private exchangeRateService = inject(ExchangeRateService);
    private toastr = inject(ToastrService);

    /** Paso del precio: el tipo de cambio se mueve en milésimas. */
    readonly PASO = 0.001;

    /** Arrancar en el precio de hoy crea una alerta que salta con el siguiente TC publicado. */
    readonly SUGERENCIA = 0.05;

    readonly tipoCambio = signal<ExchangeRate | null>(null);
    readonly filas = signal<ExchangeRateAlert[]>([]);
    readonly total = signal(0);
    readonly cargando = signal(true);
    readonly guardando = signal(false);
    readonly cargaFallida = signal(false);

    readonly pagina = signal(1);
    readonly porPagina = signal(5);
    readonly busqueda = signal('');

    /** Formulario de la izquierda. */
    readonly tipo = signal<TipoAlerta>('COMPRA');
    readonly precio = signal<number | null>(null);
    readonly comentario = signal('');

    /** 0 = sin vencimiento; sin caducidad la alerta encola trabajo por cada TC publicado, para siempre. */
    readonly dias = signal(30);

    readonly OPCIONES_DIAS = [
        { valor: 7, texto: '1 semana' },
        { valor: 30, texto: '1 mes' },
        { valor: 90, texto: '3 meses' },
        { valor: 180, texto: '6 meses' },
        { valor: 0, texto: 'Sin vencimiento' },
    ];

    /** La fecha que se manda al API, o null si el cliente eligió no caducarla. */
    private vencimiento(): string | null {
        const d = this.dias();
        if (!d) return null;
        const f = new Date();
        f.setDate(f.getDate() + d);
        return f.toISOString();
    }

    /** Lo que se pinta debajo del selector: la fecha concreta. */
    readonly textoVencimiento = computed(() => {
        const d = this.dias();
        if (!d) return 'La alerta seguirá vigilando hasta que la borres.';
        const f = new Date();
        f.setDate(f.getDate() + d);
        return `Dejará de vigilar el ${f.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}.`;
    });
    /** Id que se está editando; null = alta. */
    readonly editandoId = signal<number | null>(null);

    readonly seleccion = signal<Set<number>>(new Set());

    readonly hayAlgoSeleccionado = computed(() => this.seleccion().size > 0);

    readonly todoSeleccionado = computed(() =>
        this.filas().length > 0 && this.filas().every(f => this.seleccion().has(f.id)));

    constructor() {
        this.exchangeRateService.getOne().subscribe({
            next: tc => {
                this.tipoCambio.set(tc);
                if (this.precio() == null) this.precio.set(this.precioSugerido());
            },
            // Sin tipo de cambio la pantalla sigue sirviendo: solo se pierde la sugerencia.
            error: () => { },
        });

        this.cargar();
    }

    /** El precio de hoy de la dirección elegida. */
    precioBase(): number | null {
        const tc = this.tipoCambio();
        if (!tc) return null;
        return this.tipo() === 'COMPRA' ? tc.priceCompra : tc.priceVenta;
    }

    /** El de hoy, movido un paso hacia donde le conviene al cliente. */
    precioSugerido(): number | null {
        const base = this.precioBase();
        if (base == null) return null;
        const signo = this.tipo() === 'COMPRA' ? 1 : -1;
        return Math.round((base + signo * this.SUGERENCIA) * 1000) / 1000;
    }

    /** Diferencia entre el objetivo y el precio de hoy. Null si falta alguno. */
    readonly diferencia = computed(() => {
        const objetivo = this.precio();
        const base = this.precioBase();
        if (objetivo == null || base == null) return null;
        return Math.round((objetivo - base) * 1000) / 1000;
    });

    /** El objetivo está del lado que NO mejora: saltaría con el próximo TC en vez de avisar de algo esperado. */
    readonly objetivoSinSentido = computed(() => {
        const d = this.diferencia();
        if (d == null) return false;
        return this.tipo() === 'COMPRA' ? d <= 0 : d >= 0;
    });

    /** "por encima" / "por debajo", según lo que mejora en esta dirección. */
    ladoQueMejora(): string {
        return this.tipo() === 'COMPRA' ? 'por encima' : 'por debajo';
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.listar(this.pagina(), this.porPagina(), this.busqueda())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: p => {
                    this.filas.set(p.filas);
                    this.total.set(p.total);
                    this.cargaFallida.set(false);
                    // Mantener la selección haría que "borrar seleccionadas" tocara filas que ya no se ven.
                    this.seleccion.set(new Set());
                },
                error: () => this.cargaFallida.set(true),
            });
    }

    cambiarTipo(t: TipoAlerta): void {
        if (this.tipo() === t) return;
        this.tipo.set(t);
        // Solo se re-sugiere si el cliente no había tocado el precio o está en el sugerido de la otra dirección.
        if (this.editandoId() == null) this.precio.set(this.precioSugerido());
    }

    ajustar(delta: number): void {
        const actual = this.precio() ?? this.precioBase() ?? 0;
        // redondeo a 3 decimales: sumar 0.001 en coma flotante da 3.4010000000000002
        const nuevo = Math.max(0, Math.round((actual + delta) * 1000) / 1000);
        this.precio.set(nuevo);
    }

    editar(a: ExchangeRateAlert): void {
        this.editandoId.set(a.id);
        this.tipo.set(a.type);
        this.precio.set(a.targetPrice);
        this.comentario.set(a.comment ?? '');

        // El plazo más parecido al que queda, no el original: al guardar se recalcula desde hoy y alargaría la alerta.
        if (!a.expiresAt) { this.dias.set(0); return; }
        const quedan = Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / 86400000);
        const opciones = this.OPCIONES_DIAS.filter(o => o.valor > 0).map(o => o.valor);
        this.dias.set(opciones.reduce((a2, b) =>
            Math.abs(b - quedan) < Math.abs(a2 - quedan) ? b : a2, opciones[0]));
    }

    nueva(): void {
        this.editandoId.set(null);
        this.comentario.set('');
        this.dias.set(30);
        this.precio.set(this.precioSugerido());
    }

    guardar(): void {
        if (this.guardando()) return;

        const precio = this.precio();
        if (precio == null || precio <= 0) {
            this.toastr.warning('Indica el precio al que quieres que te avisemos.', 'Falta el precio');
            return;
        }

        const datos = {
            type: this.tipo(),
            targetPrice: precio,
            comment: this.comentario().trim() || null,
            expiresAt: this.vencimiento(),
        };

        const id = this.editandoId();
        const peticion = id == null
            ? this.service.crear(datos)
            : this.service.actualizar(id, datos);

        this.guardando.set(true);
        peticion.pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: () => {
                this.toastr.success(id == null ? 'Alerta creada' : 'Alerta actualizada', 'Listo');
                this.nueva();
                this.cargar();
            },
            error: (err: HttpErrorResponse) =>
                this.toastr.error(typeof err.error === 'string' ? err.error : 'No se pudo guardar la alerta'),
        });
    }

    borrar(a: ExchangeRateAlert): void {
        this.service.borrar(a.id).subscribe({
            next: () => { this.toastr.success('Alerta eliminada', 'Listo'); this.cargar(); },
            error: () => this.toastr.error('No se pudo eliminar la alerta'),
        });
    }

    borrarSeleccionadas(): void {
        const ids = [...this.seleccion()];
        if (ids.length === 0) return;

        this.service.borrarVarias(ids).subscribe({
            next: r => { this.toastr.success(`${r.borradas} alerta(s) eliminada(s)`, 'Listo'); this.cargar(); },
            error: () => this.toastr.error('No se pudieron eliminar las alertas'),
        });
    }

    alternar(id: number): void {
        const s = new Set(this.seleccion());
        s.has(id) ? s.delete(id) : s.add(id);
        this.seleccion.set(s);
    }

    alternarTodo(): void {
        this.seleccion.set(this.todoSeleccionado() ? new Set() : new Set(this.filas().map(f => f.id)));
    }

    buscar(valor: string): void {
        this.busqueda.set(valor);
        this.pagina.set(1);
        this.cargar();
    }

    irAPagina(evento: { pageIndex: number; pageSize: number }): void {
        this.pagina.set(evento.pageIndex + 1);
        this.porPagina.set(evento.pageSize);
        this.cargar();
    }

    /** Etiqueta de la columna de precio, como en el diseño. */
    /** En la lista, lo que la alerta significa para el cliente. */
    etiquetaPrecio(a: ExchangeRateAlert): string {
        return a.type === 'COMPRA' ? 'TE PAGAMOS' : 'TE CUESTA';
    }

    /** Cuántos días le quedan a una alerta de la lista. Null si no caduca. */
    diasQueQuedan(a: ExchangeRateAlert): number | null {
        if (!a.expiresAt) return null;
        return Math.max(0, Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / 86400000));
    }

    /** La frase de una fila de la lista, en una línea. */
    resumenFila(a: ExchangeRateAlert): string {
        return a.type === 'COMPRA'
            ? 'Avísame para vender mis dólares cuando nos los paguen a este precio'
            : 'Avísame para comprar dólares cuando cuesten este precio';
    }
}
