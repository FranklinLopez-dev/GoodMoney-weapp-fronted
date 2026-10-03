import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AlertsReportService, FilaInformeAlerta, InformeAlertas } from './alerts-report.service';

/** Se ordena por cercanía y habla desde el cliente: `COMPRA` es lo que paga Good Money, o sea que él vende. */
@Component({
    selector: 'app-alerts-report',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule],
    templateUrl: './alerts-report.component.html',
    styleUrls: ['./alerts-report.component.scss'],
})
export class AlertsReportComponent {

    private service = inject(AlertsReportService);
    private toastr = inject(ToastrService);

    readonly datos = signal<InformeAlertas | null>(null);
    readonly cargando = signal(true);

    readonly tipo = signal('');
    readonly soloActivas = signal(true);
    readonly busqueda = signal('');
    readonly pagina = signal(1);
    readonly porPagina = 25;

    readonly paginas = computed(() =>
        Math.max(1, Math.ceil((this.datos()?.total ?? 0) / this.porPagina)));

    constructor() {
        toObservable(this.busqueda)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargar());

        this.cargar();
    }

    cargar(pagina = 1): void {
        this.pagina.set(pagina);
        this.cargando.set(true);
        this.service.obtener({
            type: this.tipo(), soloActivas: this.soloActivas(),
            search: this.busqueda(), page: pagina, recordsPerPage: this.porPagina,
        })
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: d => this.datos.set(d),
                error: () => this.toastr.error('No se pudo cargar el informe de alertas'),
            });
    }

    limpiar(): void {
        this.tipo.set(''); this.soloActivas.set(true); this.busqueda.set('');
        this.cargar();
    }

    /** Qué quiere hacer el cliente, no qué hace la casa de cambio. */
    queQuiere(f: FilaInformeAlerta): string {
        return f.type === 'COMPRA' ? 'Vender dólares' : 'Comprar dólares';
    }

    /** `falta` ya viene con el signo bueno del servidor: positivo = el mercado todavía tiene que moverse. */
    textoFalta(f: FilaInformeAlerta): string {
        if (f.falta <= 0) return 'Ya está en precio';
        return `Faltan ${f.falta.toFixed(3)}`;
    }

    /** Casi a tiro: menos de un centavo de distancia. */
    esInminente(f: FilaInformeAlerta): boolean {
        return f.falta <= 0.01;
    }

    /** Dígitos con el 51 delante, como `WhatsAppService.NormalizarNumero`: sin código de país `wa.me` no existe. */
    whatsapp(f: FilaInformeAlerta): string {
        const d = (f.cliente?.cellPhone ?? '').replace(/\D/g, '');
        if (!d) return '';
        if (d.length === 9 && d.startsWith('9')) return '51' + d;
        return d.length >= 11 && d.length <= 15 ? d : '';
    }

    /** Lo que se puede marcar: celular si hay, si no el fijo. */
    telefono(f: FilaInformeAlerta): string {
        return f.cliente?.cellPhone || f.cliente?.phone || '';
    }

    /** Sin ninguna forma de contacto: la fila lo tiene que decir. */
    sinContacto(f: FilaInformeAlerta): boolean {
        return !this.telefono(f) && !f.cliente?.email;
    }
}
