import { Injectable, signal } from '@angular/core';
import { BookClaim } from 'src/app/core/models/reports/book-claims.model';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Injectable({ providedIn: 'root' })
export class BookClaimsStore {

  private readonly _items = signal<BookClaim[]>([]);
  private readonly _loading = signal(false);

  private readonly _length = signal(0);
  private readonly _pageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  private readonly _pageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);


  items = this._items.asReadonly();
  loading = this._loading.asReadonly();
  length = this._length.asReadonly();
  pageIndex = this._pageIndex.asReadonly();
  pageSize = this._pageSize.asReadonly();

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  set(items: BookClaim[]) {
      this._items.set(structuredClone(items));
    }
  
    setPagination(totalRecords: number, pageIndex: number, pageSize: number) {
      this._length.set(totalRecords);
      this._pageIndex.set(pageIndex);
      this._pageSize.set(pageSize);
    }

}
