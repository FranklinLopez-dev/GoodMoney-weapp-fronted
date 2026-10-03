import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { aFechaApi } from 'src/app/shared/utils/fechas';
import { Embudo, EmbudoService, LadoEmbudo, PasoEmbudo } from './embudo.service';

type Atajo = 'mes' | 'mes-pasado' | '30' | '90';

/** Fila del embudo ya con los dos sentidos sumados y cuánto pasó desde el paso anterior. */
interface FilaEmbudo {
    paso: PasoEmbudo;
    total: LadoEmbudo;
    /** Ancho de la barra: contra "Registraron", que es el 100 % del embudo de operaciones. */
    ancho: number;
    /** De los del paso anterior, cuántos llegaron a este. Null en el primero o si el anterior es cero. */
    pasaron: number | null;
}

/**
 * Embudo del cambio en línea (portado de NovoDivisas): cuántos clientes cotizan, registran, transfieren y
 * terminan, en qué paso se caen y cuánto tarda el equipo en atenderlos. Solo lo que registró el propio cliente.
 */
@Component({
    selector: 'app-embudo',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './embudo.component.html',
    styleUrls: ['./embudo.component.scss'],
})
export class EmbudoComponent {

    private service = inject(EmbudoService);
    private destroyRef = inject(DestroyRef);

    readonly desde = signal(aFechaApi(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    readonly hasta = signal(aFechaApi(new Date()));
    readonly atajo = signal<Atajo | null>('mes');

    readonly datos = signal<Embudo | null>(null);
    readonly cargando = signal(false);
    /** Cada consulta invalida las anteriores: una respuesta lenta no pisa a la última que se pidió. */
    private pedido = 0;

    /** Lo mismo que valida el API (máximo un año), dicho antes de consultar. */
    readonly problemaRango = computed(() => {
        const d = this.desde(), h = this.hasta();
        if (!d || !h) return 'Elige las dos fechas.';
        if (d > h) return 'La fecha final es anterior a la inicial.';
        // Redondeado: con horario de verano (fuera de Perú) un día no mide 24 h exactas.
        const dias = Math.round((new Date(h + 'T00:00:00').getTime() - new Date(d + 'T00:00:00').getTime()) / 86_400_000) + 1;
        return dias > 366 ? 'El rango no puede pasar de un año.' : null;
    });

    /** Cotizaron aparte (cuenta cotizaciones, no operaciones) y luego las etapas de las operaciones. */
    readonly cotizaron = computed(() => this.datos()?.embudo.find(p => p.clave === 'cotizaron') ?? null);
    readonly usadas = computed(() => this.datos()?.embudo.find(p => p.clave === 'cotizacion_usada') ?? null);

    readonly filas = computed<FilaEmbudo[]>(() => {
        const pasos = (this.datos()?.embudo ?? []).filter(p => p.clave !== 'cotizaron' && p.clave !== 'cotizacion_usada');
        const base = pasos.length ? this.suma(pasos[0]).n : 0;
        return pasos.map((paso, i) => {
            const total = this.suma(paso);
            const anterior = i > 0 ? this.suma(pasos[i - 1]).n : 0;
            return {
                paso, total,
                ancho: base > 0 ? Math.round(total.n * 100 / base) : 0,
                pasaron: i > 0 && anterior > 0 ? total.n / anterior : null,
            };
        });
    });

    readonly registradas = computed<LadoEmbudo | null>(() => this.filas().length ? this.filas()[0].total : null);
    readonly finalizadas = computed(() => this.filas().find(f => f.paso.clave === 'finalizada')?.total ?? null);

    /** De cada 100 que registraron, cuántos terminaron. */
    readonly conversion = computed(() => {
        const r = this.registradas()?.n ?? 0;
        return r > 0 ? (this.finalizadas()?.n ?? 0) / r : null;
    });

    /** Barras por día escaladas al día con más registradas. */
    readonly maxDia = computed(() => Math.max(1, ...(this.datos()?.porDia ?? []).map(d => d.registradas)));

    constructor() {
        this.cargar();
    }

    usarAtajo(a: Atajo): void {
        const hoy = new Date();
        const [d, h] =
            a === 'mes' ? [new Date(hoy.getFullYear(), hoy.getMonth(), 1), hoy]
            : a === 'mes-pasado' ? [new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), new Date(hoy.getFullYear(), hoy.getMonth(), 0)]
            : [new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (Number(a) - 1)), hoy];
        this.desde.set(aFechaApi(d));
        this.hasta.set(aFechaApi(h));
        this.atajo.set(a);
        this.cargar();
    }

    cambiarFecha(campo: 'desde' | 'hasta', valor: string): void {
        this[campo].set(valor ?? '');
        this.atajo.set(null);
    }

    cargar(): void {
        if (this.problemaRango()) return;
        const este = ++this.pedido;
        this.cargando.set(true);
        this.service.obtener(this.desde(), this.hasta())
            .pipe(
                finalize(() => { if (este === this.pedido) this.cargando.set(false); }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: d => { if (este === this.pedido) this.datos.set(d); },
                // El interceptor ya avisa del error; se deja lo último que se vio.
                error: () => { },
            });
    }

    suma(p: PasoEmbudo): LadoEmbudo {
        return { n: p.compra.n + p.venta.n, montoUsd: p.compra.montoUsd + p.venta.montoUsd, totalPen: p.compra.totalPen + p.venta.totalPen };
    }

    /** 95 min → "1 h 35 min"; menos de una hora, en minutos. */
    duracion(minutos: number): string {
        const m = Math.round(minutos);
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
        const d = Math.floor(h / 24);
        return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
    }

    ancho(n: number, max: number): number {
        return max > 0 ? Math.round(n * 100 / max) : 0;
    }
}
