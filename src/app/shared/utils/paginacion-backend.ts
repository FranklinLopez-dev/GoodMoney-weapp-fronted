import { HttpParams } from '@angular/common/http';

/** Las dos capitalizaciones de `RecordsTotal`: los encabezados no distinguen, pero algunos proxys las cambian. */
export function totalDelEncabezado(headers: { get(name: string): string | null }): number {
    return Number(headers.get('recordstotal') ?? headers.get('RecordsTotal') ?? 0);
}

/** El backend pagina en base 1; Material en base 0. */
export function parametrosDePagina(pageIndex: number, pageSize: number): HttpParams {
    return new HttpParams().set('Page', pageIndex + 1).set('RecordsByPage', pageSize);
}
