import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { ComplianceService, RevisionLaft } from '../compliance.service';
import { descargarArchivo, mostrarError } from '../compliance-comunes';

/** yyyy-MM-dd de una fecha local (no toISOString: en Lima correría el día). */
function iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Revisión mensual LAFT: las operaciones del período con el régimen de debida diligencia del cliente
 * y por qué son inusuales. Es el insumo con el que el oficial revisa el mes y decide qué pasa a ROS.
 */
@Component({
    selector: 'app-compliance-revision-laft',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './revision-laft.component.html',
    styleUrls: ['../_compartido.scss', './revision-laft.component.scss'],
})
export class ComplianceRevisionLaftComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);

    // Por defecto el mes anterior: es el que se revisa.
    readonly desde = signal(iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));
    readonly hasta = signal(iso(new Date(new Date().getFullYear(), new Date().getMonth(), 0)));
    readonly soloInusuales = signal(true);

    readonly revision = signal<RevisionLaft | null>(null);
    readonly cargando = signal(false);
    readonly exportando = signal(false);

    /** Con qué se generó lo que está en pantalla: el Excel exporta eso, no lo que diga el filtro ahora. */
    private generada: { desde: string; hasta: string; soloInusuales: boolean } | null = null;
    private consulta = 0;

    // Se pagina en pantalla: sin "solo inusuales" un rango largo trae miles de filas.
    readonly pagina = signal(0);
    readonly tamano = signal(50);
    readonly visibles = computed(() => {
        const filas = this.revision()?.filas ?? [];
        return filas.slice(this.pagina() * this.tamano(), (this.pagina() + 1) * this.tamano());
    });

    constructor() { this.cargar(); }

    cargar(): void {
        const esta = ++this.consulta;
        const pedido = { desde: this.desde(), hasta: this.hasta(), soloInusuales: this.soloInusuales() };
        this.cargando.set(true);
        this.service.revisionLaft(pedido.desde, pedido.hasta, pedido.soloInusuales)
            .pipe(finalize(() => { if (esta === this.consulta) this.cargando.set(false); }))
            .subscribe({
                next: r => {
                    if (esta !== this.consulta) return;   // llegó tarde la de un filtro anterior
                    this.revision.set(r);
                    this.generada = pedido;
                    this.pagina.set(0);
                },
                error: (e: HttpErrorResponse) => { if (esta === this.consulta) mostrarError(this.toastr, e, 'No se pudo generar la revisión.'); },
            });
    }

    cambiarPagina(e: PageEvent): void { this.pagina.set(e.pageIndex); this.tamano.set(e.pageSize); }

    exportar(): void {
        const g = this.generada;
        if (!g) return;
        this.exportando.set(true);
        this.service.revisionLaftExcel(g.desde, g.hasta, g.soloInusuales)
            .pipe(finalize(() => this.exportando.set(false)))
            .subscribe({
                next: b => descargarArchivo(b, `REVISION-LAFT-${g.desde}-${g.hasta}.xlsx`),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo generar el archivo.'),
            });
    }

    claseRiesgo(riesgo: string): string {
        return riesgo === 'Alto' ? 'cmp-chip--alta' : riesgo === 'Medio' ? 'cmp-chip--media' : 'cmp-chip--ok';
    }
}
