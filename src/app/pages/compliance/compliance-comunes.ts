import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

/** Lo común de las siete pantallas: color de cada estado y qué se enseña cuando el API rechaza algo. */

/** El API devuelve el motivo escrito para leerse; enseñarlo tal cual evita que el oficial abra una incidencia. */
export function mostrarError(toastr: ToastrService, e: HttpErrorResponse, porDefecto: string): void {
    // Las descargas (Excel) piden un Blob, así que el motivo del 400 también llega como Blob.
    if (e.error instanceof Blob) {
        e.error.text()
            .then(t => toastr.error(t.trim() && !t.trim().startsWith('{') ? t : porDefecto))
            .catch(() => toastr.error(porDefecto));
        return;
    }
    const detalle = typeof e.error === 'string' && e.error.trim() ? e.error : porDefecto;
    toastr.error(detalle);
}

export function claseSeveridad(severidad: string | null | undefined): string {
    switch (severidad) {
        case 'Alta': return 'cmp-chip--alta';
        case 'Media': return 'cmp-chip--media';
        default: return 'cmp-chip--baja';
    }
}

export function claseEstado(estado: string | null | undefined): string {
    switch (estado) {
        case 'Pendiente': case 'Abierto': return 'cmp-chip--pendiente';
        case 'Revisado': case 'Calificado': case 'Exportado': return 'cmp-chip--revisado';
        case 'Justificado': case 'Desestimado': case 'Descartado': return 'cmp-chip--ok';
        case 'Enviado': case 'Remitido': case 'OK': return 'cmp-chip--ok';
        case 'Confirmado': case 'Error': return 'cmp-chip--alta';
        default: return 'cmp-chip--baja';
    }
}

export function claseNivel(nivel: string | null | undefined): string {
    switch (nivel) {
        case 'Rojo': return 'cmp-chip--alta';
        case 'Ambar': return 'cmp-chip--media';
        default: return 'cmp-chip--ok';
    }
}

export { descargarArchivo } from 'src/app/shared/utils/descargas';

export const MESES = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Setiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' },
];

export function nombreMes(mes: number): string {
    return MESES.find(m => m.valor === mes)?.nombre ?? String(mes);
}

/** Lee un archivo del disco como base64 sin el prefijo `data:`. */
export function leerArchivoBase64(archivo: File): Promise<{ base64: string; nombre: string }> {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onerror = () => rechazar(lector.error);
        lector.onload = () => {
            const resultado = String(lector.result);
            const coma = resultado.indexOf(',');
            resolver({ base64: coma > 0 ? resultado.slice(coma + 1) : resultado, nombre: archivo.name });
        };
        lector.readAsDataURL(archivo);
    });
}
