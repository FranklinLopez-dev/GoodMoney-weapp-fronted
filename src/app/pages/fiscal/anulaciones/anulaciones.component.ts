import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { FiscalService, SolicitudAnulacion } from '../fiscal.service';
import { mostrarErrorFiscal } from '../fiscal-comunes';

/**
 * Solicitudes de anulación. Aprobar EJECUTA la baja o la nota de crédito ante SUNAT; quien pidió la
 * anulación no puede aprobarla (lo impide el servidor).
 */
@Component({
    selector: 'app-fiscal-anulaciones',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    template: `
<div class="cmp-panel">
  <p class="cmp-bajada">
    Aprobar una solicitud la ejecuta ante SUNAT: la <strong>baja</strong> se confirma en minutos; la
    <strong>nota de crédito</strong> queda aceptada al instante. Quien pidió la anulación no puede aprobarla.
  </p>
  <div class="cmp-filtros">
    <mat-form-field appearance="outline">
      <mat-label>Estado</mat-label>
      <mat-select [ngModel]="estado()" (ngModelChange)="estado.set($event); cargar()">
        <!-- -1 y no null: con null Material deja el selector en blanco como si no hubiera nada elegido. -->
        <mat-option [value]="0">Por aprobar</mat-option>
        <mat-option [value]="1">Aprobadas</mat-option>
        <mat-option [value]="2">Rechazadas</mat-option>
        <mat-option [value]="-1">Todas</mat-option>
      </mat-select>
    </mat-form-field>
  </div>
  @if (cargando() && !solicitudes().length) {
  <p class="cmp-nota">Cargando…</p>
  } @else if (!solicitudes().length) {
  <p class="cmp-nota">No hay solicitudes.</p>
  } @else {
  <div class="cmp-tabla fis-tabla--anulaciones">
    <div class="cmp-fila cmp-fila--cabecera">
      <span>Comprobante</span><span>Cómo</span><span>Motivo</span>
      <span>Pedida</span><span>Resultado</span><span></span>
    </div>
    @for (s of solicitudes(); track s.id) {
    <div class="cmp-fila">
      <span><strong>{{ s.comprobante }}</strong><small class="cmp-doc">{{ s.codigoOperacion }} · {{ s.cliente }} · S/ {{ s.total | number:'1.2-2' }}</small></span>
      <span>
        {{ s.accionFiscal === 'baja' ? 'Baja ante SUNAT' : 'Nota de crédito (' + s.codigoTipoNota + ')' }}
        @if (s.reemitir) { <small class="cmp-doc">y reemitir</small> }
      </span>
      <span>{{ s.motivo }}</span>
      <span>{{ s.fechaSolicitud | date:'dd/MM HH:mm' }}<small class="cmp-doc">{{ s.solicitadaPor }}</small></span>
      <span>
        @switch (s.estado) {
          @case (0) { <span class="cmp-chip cmp-chip--pendiente">Por aprobar</span> }
          @case (1) { <span class="cmp-chip cmp-chip--ok">Aprobada</span><small class="cmp-doc">{{ s.aprobadaPor }}</small> }
          @case (2) { <span class="cmp-chip cmp-chip--baja">Rechazada</span><small class="cmp-doc">{{ s.motivoRechazo }}</small> }
        }
        @if (s.observaciones) { <small class="fis-motivo">{{ s.observaciones }}</small> }
      </span>
      <span>
        @if (puedeAprobar && s.estado === 0) {
        <button mat-flat-button color="primary" type="button" [disabled]="ocupado() === s.id" (click)="aprobar(s)">Aprobar</button>
        <button mat-button type="button" [disabled]="ocupado() === s.id" (click)="rechazar(s)">Rechazar</button>
        }
      </span>
    </div>
    }
  </div>
  }
</div>`,
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FiscalAnulacionesComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    readonly puedeAprobar = inject(AuthStore).hasPermission(Permission.FiscalAprobar);

    readonly solicitudes = signal<SolicitudAnulacion[]>([]);
    readonly estado = signal<number>(0);
    readonly cargando = signal(false);
    readonly ocupado = signal<number | null>(null);

    constructor() { this.cargar(); }

    cargar(): void {
        this.cargando.set(true);
        this.service.anulaciones(this.estado() === -1 ? null : this.estado())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: s => this.solicitudes.set(s ?? []),
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron cargar las solicitudes.'),
            });
    }

    aprobar(s: SolicitudAnulacion): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Aprobar anulación',
                message: `Se ${s.accionFiscal === 'baja' ? 'dará de baja' : 'emitirá una nota de crédito sobre'} ${s.comprobante} ante SUNAT. ` +
                         'No tiene vuelta atrás.',
                confirmText: 'Aprobar y ejecutar',
                color: 'warn',
            },
        }).afterClosed().subscribe(ok => {
            if (!ok) return;
            this.ocupado.set(s.id);
            this.service.aprobarAnulacion(s.id).pipe(finalize(() => this.ocupado.set(null))).subscribe({
                next: r => { this.toastr.success(r.mensaje); this.cargar(); },
                error: (e: HttpErrorResponse) => { mostrarErrorFiscal(this.toastr, e, 'No se pudo aprobar.'); this.cargar(); },
            });
        });
    }

    rechazar(s: SolicitudAnulacion): void {
        const motivo = prompt('Motivo del rechazo (opcional):') ?? null;
        if (motivo === null) return;
        this.ocupado.set(s.id);
        this.service.rechazarAnulacion(s.id, motivo).pipe(finalize(() => this.ocupado.set(null))).subscribe({
            next: r => { this.toastr.success(r.mensaje); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo rechazar.'),
        });
    }
}
