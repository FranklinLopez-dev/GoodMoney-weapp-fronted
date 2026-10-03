import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { ComplianceService, Iaoc, IaocMes } from '../compliance.service';
import { descargarArchivo, mostrarError, nombreMes } from '../compliance-comunes';

/**
 * Estadísticas del año para el Informe Anual del Oficial de Cumplimiento: mes a mes, con el mismo corte
 * que el Registro de Operaciones. Los números del ROS solo los ve quien tiene compliance.ros (el servidor
 * no los manda a los demás).
 */
@Component({
    selector: 'app-compliance-iaoc',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './iaoc.component.html',
    styleUrls: ['../_compartido.scss', './iaoc.component.scss'],
})
export class ComplianceIaocComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);

    readonly nombreMes = nombreMes;
    private readonly hoy = new Date();
    // El informe se hace a comienzos de año sobre el anterior: por eso el anterior va primero si estamos en enero.
    readonly anios = Array.from({ length: 5 }, (_, i) => this.hoy.getFullYear() - i);
    readonly anio = signal(this.hoy.getMonth() === 0 ? this.hoy.getFullYear() - 1 : this.hoy.getFullYear());

    readonly datos = signal<Iaoc | null>(null);
    readonly cargando = signal(false);
    readonly exportando = signal(false);
    private consulta = 0;

    /** Meses con RO que se marcó enviado fuera de plazo, o que ya venció sin enviarse. */
    readonly fueraDePlazo = computed(() =>
        (this.datos()?.meses ?? []).filter(m => m.roEnPlazo === false || m.roVencido).length);

    constructor() { this.cargar(); }

    cargar(): void {
        const esta = ++this.consulta;
        this.cargando.set(true);
        this.service.iaoc(this.anio())
            .pipe(finalize(() => { if (esta === this.consulta) this.cargando.set(false); }))
            .subscribe({
                next: d => { if (esta === this.consulta) this.datos.set(d); },
                error: (e: HttpErrorResponse) => {
                    if (esta !== this.consulta) return;
                    this.datos.set(null);
                    mostrarError(this.toastr, e, 'No se pudieron calcular las estadísticas.');
                },
            });
    }

    exportar(): void {
        const year = this.datos()?.year;
        if (!year) return;
        this.exportando.set(true);
        this.service.iaocExcel(year)
            .pipe(finalize(() => this.exportando.set(false)))
            .subscribe({
                next: b => descargarArchivo(b, `IAOC-${year}.xlsx`),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo generar el archivo.'),
            });
    }

    sinFilas(year: number, mes: number, cerrado: boolean): string {
        if (cerrado) return 'Sin filas: nada que remitir';
        const hoy = new Date();
        return year === hoy.getFullYear() && mes === hoy.getMonth() + 1 ? 'Mes en curso' : '—';
    }

    /** Lo que dice el chip de la remisión. */
    rotuloRemision(m: IaocMes): string {
        if (m.estadoRo === 'Enviado')
            return m.roEnPlazo === null ? 'Enviado' : m.roEnPlazo ? 'Enviado en plazo' : 'Enviado fuera de plazo';
        return m.roVencido ? `${m.estadoRo} · vencido` : m.estadoRo ?? '';
    }

    claseRemision(m: IaocMes): string {
        if (m.estadoRo === 'Enviado') return m.roEnPlazo === false ? 'cmp-chip--alta' : 'cmp-chip--ok';
        return m.roVencido ? 'cmp-chip--alta' : 'cmp-chip--pendiente';
    }
}
