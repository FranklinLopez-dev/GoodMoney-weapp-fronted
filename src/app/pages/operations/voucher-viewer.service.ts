import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, finalize } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';

/**
 * Abre los vouchers de una operación. Ya no son una URL pública: se piden al API con la sesión
 * (GET operations/{id}/voucher) y se muestran desde un blob, que se libera al cerrar el visor.
 */
@Injectable({ providedIn: 'root' })
export class VoucherViewerService {

    private http = inject(HttpClient);
    private dialog = inject(MatDialog);
    private baseUrl = `${environment.apiUrl}/api/operations`;

    /** El voucher que subió el cliente. */
    abrirVoucher(operationId: number): void {
        this.abrir(this.http.get(`${this.baseUrl}/${operationId}/voucher`, { responseType: 'blob' }), 'Voucher');
    }

    /** El comprobante de lo que la casa le transfirió al cliente en una de sus cuentas. */
    abrirVoucherEnvio(operationBankId: number): void {
        this.abrir(this.http.get(`${this.baseUrl}/banks/${operationBankId}/voucher`, { responseType: 'blob' }), 'Comprobante de envío');
    }

    /** Un doble clic no abre dos visores. */
    private abriendo = false;

    private abrir(pedido: Observable<Blob>, nombre: string): void {
        if (this.abriendo) return;
        this.abriendo = true;
        pedido.pipe(finalize(() => this.abriendo = false)).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                this.dialog.open(FileViewerDialogComponent, {
                    data: { name: nombre, type: blob.type === 'application/pdf' ? 'PDF' : 'PNG', url },
                    panelClass: 'file-viewer-dialog',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                }).afterClosed().subscribe(() => URL.revokeObjectURL(url));
            },
            // El interceptor ya avisa (404 "Recurso no encontrado", sin sesión, etc.).
            error: () => {},
        });
    }
}
