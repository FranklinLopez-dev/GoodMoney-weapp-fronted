import { VoucherViewerService } from 'src/app/pages/operations/voucher-viewer.service';
import { OperationsService } from '../../operations.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FiscalService } from '../../../fiscal/fiscal.service';
import { descargarArchivo, mostrarErrorFiscal } from '../../../fiscal/fiscal-comunes';
import { Component, Input, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { Operation } from 'src/app/core/models/operations/operations.model';
import { MaterialModule } from 'src/app/material.module';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
  selector: 'app-operation-timeline',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, TablerIconsModule, FallbackImgDirective, MaterialModule],
  templateUrl: './operation-timeline.component.html',
  styleUrls: ['./operation-timeline.component.scss']
})
export class OperationTimelineComponent {
  readonly vouchers = inject(VoucherViewerService);

  @Input({ required: true }) operation!: Operation;

  readonly baseUrl = environment.apiUrl;
  readonly layout = inject(FullComponent);
  private dialog = inject(MatDialog);
  private fiscal = inject(FiscalService);
  private toastr = inject(ToastrService);
  private operaciones = inject(OperationsService);

  /** Comprobante del motor nativo: se descarga con la sesión del usuario. */
  descargarComprobante(): void {
    const op = this.operation;
    if (!op) return;
    this.fiscal.pdfDeOperacion(op.id).subscribe({
      next: b => descargarArchivo(b, `${op.serie}-${op.correlative}.pdf`),
      error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'El comprobante todavía no está disponible.'),
    });
  }

  /** Declaración jurada SBS firmada (o la del mes que cubre esta operación). */
  descargarDj(): void {
    const op = this.operation;
    if (!op) return;
    this.operaciones.djPdf(op.id).subscribe({
      next: b => descargarArchivo(b, `DJ-GM-${String(op.id).padStart(8, '0')}.pdf`),
      error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo descargar la declaración jurada.'),
    });
  }

  /* STATUS */
  get status(): number {
    return Number(this.operation?.status || 0);
  }

  get isRegistered() { return this.status >= 1; }
  get isProcessed() { return this.status >= 2; }
  get isFinalized() { return this.status === 3; }
  get isCancelled() { return this.status === 0; }

  /* SUB STATES */
  get hasTransferReceived() {
    return !!this.operation?.sendEmail1;
  }

  get hasTransferSent() {
    return !!this.operation?.sendEmail2;
  }

  booleanNumber(value?: string | null): boolean {
    return !!value && Number(value) !== 0;
  }

  closeDrawer(): void {
    this.layout.closeGlobalDrawer();
  }

  get statusLabel(): string {
    switch (String(this.operation.status)) {
      case '1': return 'Registrada';
      case '2': return 'Procesada';
      case '3': return 'Finalizada';
      case '0': return 'Cancelada';
      default: return '—';
    }
  }

  get statusClass(): string {
    switch (String(this.operation.status)) {
      case '1': return 'badge-registered';
      case '2': return 'badge-processed';
      case '3': return 'badge-finalized';
      case '0': return 'badge-cancelled';
      default: return '';
    }
  }
}
