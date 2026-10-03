import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

export { descargarArchivo } from 'src/app/shared/utils/descargas';

/**
 * El API explica el motivo en texto. En las descargas (responseType blob) ese texto llega DENTRO de
 * un Blob: sin leerlo, el operador vería "no se pudo" cuando el servidor le estaba diciendo por qué.
 */
export async function mostrarErrorFiscal(toastr: ToastrService, e: HttpErrorResponse, porDefecto: string): Promise<void> {
    let detalle: string | null = null;
    if (typeof e.error === 'string') {
        detalle = e.error;
    } else if (e.error instanceof Blob) {
        try { detalle = await e.error.text(); } catch { detalle = null; }
    } else if (e.error?.message) {
        detalle = e.error.message;
    }
    toastr.error(detalle && detalle.trim() && !detalle.trim().startsWith('{') ? detalle : porDefecto);
}

/** Color de cada estado del comprobante: solo lo que pide atención se tiñe. */
export function claseEstadoComprobante(estado: number): string {
    switch (estado) {
        case 1: return 'cmp-chip--ok';          // Aceptado
        case 0: return 'cmp-chip--pendiente';   // Pendiente de envío
        case 2: return 'cmp-chip--alta';        // Rechazado
        case 6: return 'cmp-chip--media';       // Baja en proceso
        default: return 'cmp-chip--baja';       // Anulado, dado de baja, reemplazado
    }
}

export const ESTADOS_COMPROBANTE = [
    { valor: 0, nombre: 'Pendiente de envío' },
    { valor: 1, nombre: 'Aceptado' },
    { valor: 2, nombre: 'Rechazado' },
    { valor: 6, nombre: 'Baja en proceso' },
    { valor: 3, nombre: 'Dado de baja' },
    { valor: 4, nombre: 'Anulado con nota de crédito' },
    { valor: 5, nombre: 'Reemplazado' },
];

export const TIPOS_COMPROBANTE = [
    { valor: 1, nombre: 'Boleta' },
    { valor: 2, nombre: 'Factura' },
    { valor: 3, nombre: 'Nota de crédito' },
];

/** yyyy-MM-dd local (no toISOString: en Lima correría el día). */
export function fechaParaApi(d: Date | null): string | null {
    if (!d) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}
