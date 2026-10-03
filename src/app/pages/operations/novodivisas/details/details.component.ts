import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { Profile } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { environment } from 'src/environments/environment';
import { FiscalService } from '../../../fiscal/fiscal.service';
import { descargarArchivo, mostrarErrorFiscal } from '../../../fiscal/fiscal-comunes';

/**
 * Resultado del registro de una operación desde el panel. El comprobante sale firmado al instante
 * y su envío a SUNAT sigue en segundo plano: por eso no se dice "aceptada" aquí.
 */
@Component({
    selector: 'app-divisafe-details',
    templateUrl: './details.component.html',
    imports: [
        MaterialModule,
        TablerIconsModule,
        CommonModule,
      ],
})
export class DetailsNovodivisasComponent {
    private fiscal = inject(FiscalService);
    private toastr = inject(ToastrService);

    constructor(
        public matDialogRef: MatDialogRef<DetailsNovodivisasComponent>,
        @Inject(MAT_DIALOG_DATA) public _data: { respuesta: any, profile: Profile },
    ) { }

    get numero(): string | null { return this._data.respuesta?.data?.number ?? null; }
    get operationId(): number | null { return this._data.respuesta?.data?.operationId ?? null; }
    get mensaje(): string { return this._data.respuesta?.data?.qr ?? ''; }

    descargar(formato: 'A4' | 'Ticket'): void {
        if (!this.operationId) return;
        this.fiscal.pdfDeOperacion(this.operationId, formato).subscribe({
            next: b => descargarArchivo(b, `${this.numero}${formato === 'Ticket' ? '-ticket' : ''}.pdf`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo generar el comprobante.'),
        });
    }

    enviarWhatsApp(number: string) {
        // El comprobante ya no tiene un enlace público permanente: se manda el número y dónde validarlo.
        const texto = `Su comprobante de pago electrónico ${this.numero} ha sido emitido. ` +
                      `Puede validarlo en ${environment.urlConsulta}`;
        window.open(
            'https://api.whatsapp.com/send/?phone=51' + number + '&text=' + encodeURIComponent(texto),
            '_blank',
            'noopener,noreferrer'
        );
    }
}
