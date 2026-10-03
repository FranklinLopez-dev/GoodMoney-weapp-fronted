import { MatPaginatorIntl } from '@angular/material/paginator';

/** Textos del paginador en español; Material los trae en inglés y salen en las 23 tablas. */
export function paginadorEnEspanol(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();

  intl.itemsPerPageLabel = 'Filas por página';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';

  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 de ${length}`;

    const total = Math.max(length, 0);
    const desde = page * pageSize;
    // El último tramo puede quedar corto: no se anuncian filas que no existen.
    const hasta = desde < total ? Math.min(desde + pageSize, total) : desde + pageSize;

    return `${desde + 1} – ${hasta} de ${total}`;
  };

  return intl;
}
