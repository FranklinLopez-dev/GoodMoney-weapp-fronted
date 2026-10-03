import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';
import { BookClaimsStore } from './book-claims.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { BookClaimsService } from './book-claims.service';

@Injectable({ providedIn: 'root' })
export class BookClaimsResolver {

  private service = inject(BookClaimsService);
  private store = inject(BookClaimsStore);

  resolve() {
    const today = aFechaApi(new Date());

    const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
    const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    this.store.setLoading(true);

    return this.service.getBookClaimsAdmin(
      today,
      today,
      PAGINATION_CONFIG.DEFAULT_PAGE_INDEX,
      PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
    ).pipe(
      tap(response => {
        const data = response.body ?? [];
        const totalRecords = totalDelEncabezado(response.headers);
        this.store.set(data);
        this.store.setPagination(totalRecords, pageIndex, pageSize);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
