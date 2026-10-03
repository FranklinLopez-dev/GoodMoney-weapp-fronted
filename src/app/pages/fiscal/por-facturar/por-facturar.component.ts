import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { FiscalService, OperacionPorFacturar } from '../fiscal.service';
import { mostrarErrorFiscal } from '../fiscal-comunes';

/**
 * Operaciones finalizadas sin comprobante: las que quedaron mientras la empresa estaba en beta, o
 * cuya emisión se frenó (datos del cliente que SUNAT rechazaría). Salen solas cada 15 minutos en
 * producción; aquí se ve el motivo y se puede emitir a mano tras corregir el perfil.
 */
@Component({
    selector: 'app-fiscal-por-facturar',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    template: `
<div class="cmp-panel">
  <p class="cmp-bajada">
    Operaciones finalizadas que todavía no tienen comprobante. En producción se emiten solas cada 15 minutos;
    si una no sale, suele ser un dato del cliente (DNI, RUC): corrígelo en su perfil y emítela aquí.
  </p>
  @if (cargando() && !operaciones().length) {
  <p class="cmp-nota">Cargando…</p>
  } @else if (!operaciones().length) {
  <p class="cmp-nota">No hay operaciones por facturar.</p>
  } @else {
  <div class="cmp-tabla fis-tabla--por-facturar">
    <div class="cmp-fila cmp-fila--cabecera">
      <span>Operación</span><span>Finalizada</span><span>Cliente</span>
      <span class="cmp-numero">Monto</span><span class="cmp-numero">Total</span><span></span>
    </div>
    @for (o of operaciones(); track o.id) {
    <div class="cmp-fila">
      <span><strong>{{ o.codigoOperacion }}</strong><small class="cmp-doc">{{ o.typeOperation === '1' ? 'Compra' : 'Venta' }} · TC {{ o.tipoCambio }}</small></span>
      <span>{{ o.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
      <span>{{ o.cliente }}<small class="cmp-doc">{{ o.documento }}</small></span>
      <span class="cmp-numero">$ {{ o.monto | number:'1.2-2' }}</span>
      <span class="cmp-numero">S/ {{ o.total | number:'1.2-2' }}</span>
      <span>
        @if (puedeGestionar) {
        <button mat-stroked-button type="button" [disabled]="ocupado() === o.id" (click)="emitir(o)">
          {{ ocupado() === o.id ? 'Emitiendo…' : 'Emitir' }}
        </button>
        }
      </span>
    </div>
    }
  </div>
  <mat-paginator [length]="total()" [pageIndex]="pagina()" [pageSize]="tamano()" [pageSizeOptions]="[20, 50, 100]"
                 (page)="cambiarPagina($event)"></mat-paginator>
  }
</div>`,
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FiscalPorFacturarComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    readonly puedeGestionar = inject(AuthStore).hasPermission(Permission.FiscalManage);

    readonly operaciones = signal<OperacionPorFacturar[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(0);
    readonly tamano = signal(20);
    readonly cargando = signal(false);
    readonly ocupado = signal<number | null>(null);

    constructor() { this.cargar(); }

    cargar(): void {
        this.cargando.set(true);
        this.service.porFacturar(this.pagina() + 1, this.tamano())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => { this.operaciones.set(r.body ?? []); this.total.set(totalDelEncabezado(r.headers)); },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar las operaciones.'),
            });
    }

    cambiarPagina(e: PageEvent): void {
        this.pagina.set(e.pageIndex);
        this.tamano.set(e.pageSize);
        this.cargar();
    }

    emitir(o: OperacionPorFacturar): void {
        this.ocupado.set(o.id);
        this.service.emitir(o.id).pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: r => { this.toastr.success(r.mensaje); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo emitir el comprobante.'),
        });
    }
}
