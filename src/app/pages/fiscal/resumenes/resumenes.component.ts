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
import { FiscalService, ResumenSunat } from '../fiscal.service';
import { descargarArchivo, mostrarErrorFiscal } from '../fiscal-comunes';

/** Libro de envíos asíncronos a SUNAT: comunicaciones de baja (RA) y resúmenes de boletas (RC), con su ticket. */
@Component({
    selector: 'app-fiscal-resumenes',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    template: `
<div class="cmp-panel">
  <p class="cmp-bajada">
    Bajas de facturas (RA) y resúmenes de boletas (RC). SUNAT los procesa por ticket: se confirman solos,
    o aquí con «Consultar».
  </p>
  @if (puedeGestionar) {
  <div class="fis-acciones">
    <button mat-stroked-button type="button" [disabled]="enviando()" (click)="enviarPendientes()">
      {{ enviando() ? 'Enviando…' : 'Enviar resumen de boletas pendientes' }}
    </button>
  </div>
  }
  @if (cargando() && !resumenes().length) {
  <p class="cmp-nota">Cargando…</p>
  } @else if (!resumenes().length) {
  <p class="cmp-nota">Todavía no hay resúmenes ni bajas.</p>
  } @else {
  <div class="cmp-tabla fis-tabla--resumenes">
    <div class="cmp-fila cmp-fila--cabecera">
      <span>Identificador</span><span>Del día</span><span>Documentos</span><span>SUNAT</span><span>Estado</span><span></span>
    </div>
    @for (r of resumenes(); track r.id) {
    <div class="cmp-fila">
      <span><strong>{{ r.identificador }}</strong><small class="cmp-doc">{{ r.tipo === 'RA' ? 'Comunicación de baja' : 'Resumen de boletas' }}@if (r.ambiente === 0) { · BETA }</small></span>
      <span>{{ r.fechaReferencia | date:'dd/MM/yyyy' }}</span>
      <span>{{ r.documentos.join(', ') }}</span>
      <span><small class="fis-motivo">@if (r.codigoRespuesta) { [{{ r.codigoRespuesta }}] } {{ r.mensaje }}</small><small class="cmp-doc">Ticket {{ r.ticket || '—' }}</small></span>
      <span><span class="cmp-chip" [ngClass]="clase(r.estado)">{{ r.estado }}</span></span>
      <span>
        @if (puedeGestionar && (r.estado === 'Enviado' || r.estado === 'EnProceso')) {
        <button mat-button type="button" [disabled]="ocupado() === r.id" (click)="consultar(r)">Consultar</button>
        }
        @if (r.tieneXml) { <button mat-button type="button" (click)="archivo(r, 'xml')">XML</button> }
        @if (r.tieneCdr) { <button mat-button type="button" (click)="archivo(r, 'cdr')">CDR</button> }
      </span>
    </div>
    }
  </div>
  <mat-paginator [length]="total()" [pageIndex]="pagina()" [pageSize]="tamano()" [pageSizeOptions]="[20, 50]"
                 (page)="cambiarPagina($event)"></mat-paginator>
  }
</div>`,
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FiscalResumenesComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    readonly puedeGestionar = inject(AuthStore).hasPermission(Permission.FiscalManage);

    readonly resumenes = signal<ResumenSunat[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(0);
    readonly tamano = signal(20);
    readonly cargando = signal(false);
    readonly enviando = signal(false);
    readonly ocupado = signal<number | null>(null);

    constructor() { this.cargar(); }

    clase(estado: string): string {
        switch (estado) {
            case 'Aceptado': return 'cmp-chip--ok';
            case 'Rechazado': return 'cmp-chip--alta';
            case 'Enviado': case 'EnProceso': return 'cmp-chip--pendiente';
            default: return 'cmp-chip--baja';
        }
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.resumenes(this.pagina() + 1, this.tamano())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => { this.resumenes.set(r.body ?? []); this.total.set(totalDelEncabezado(r.headers)); },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar los resúmenes.'),
            });
    }

    cambiarPagina(e: PageEvent): void {
        this.pagina.set(e.pageIndex);
        this.tamano.set(e.pageSize);
        this.cargar();
    }

    consultar(r: ResumenSunat): void {
        this.ocupado.set(r.id);
        this.service.consultarResumen(r.id).pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: m => { this.toastr.info(m.mensaje); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo consultar el ticket.'),
        });
    }

    enviarPendientes(): void {
        this.enviando.set(true);
        this.service.enviarResumenes().pipe(finalize(() => this.enviando.set(false))).subscribe({
            next: r => { r.mensajes.forEach(m => this.toastr.info(m)); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo enviar el resumen.'),
        });
    }

    archivo(r: ResumenSunat, tipo: 'xml' | 'cdr'): void {
        this.service.archivoResumen(r.id, tipo).subscribe({
            next: b => descargarArchivo(b, `${r.identificador}${tipo === 'cdr' ? '-cdr.zip' : '.xml'}`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo descargar el archivo.'),
        });
    }
}
