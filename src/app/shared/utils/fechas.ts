import { formatDate } from '@angular/common';

/** Formato que espera el API en filtros y rutas de fechas. */
export function aFechaApi(fecha: Date | string | number): string {
    return formatDate(fecha, 'yyyy-MM-dd', 'en-US');
}
