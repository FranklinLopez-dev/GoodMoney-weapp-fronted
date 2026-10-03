import { Injectable, computed, signal } from '@angular/core';
import { CompanyBanks } from 'src/app/core/models';
import { OperationDTO } from 'src/app/core/models/operations/operations.model';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Injectable({ providedIn: 'root' })
export class OperationsWebStore {

  private _items = signal<OperationDTO | null>(null);
  private _loading = signal(false);
  private _totalRecords = signal(0);
  private _pageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  private _pageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

  private _companyBanks = signal<CompanyBanks[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly companyBanks = this._companyBanks.asReadonly();

  hasData = computed(() => !!this._items()?.operations.length);

  set(items: OperationDTO) {
    this._items.set(structuredClone(items));
  }

  setCompanyBanks(banks: CompanyBanks[]) {
    this._companyBanks.set(structuredClone(banks));
  }

  setPagination(totalRecords: number, pageIndex: number, pageSize: number) {
    this._totalRecords.set(totalRecords);
    this._pageIndex.set(pageIndex);
    this._pageSize.set(pageSize);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  findById(id: number) {
    return computed(() =>
      this._items()?.operations.find(u => u.id === id) ?? null
    );
  }

  clear() {
    this._items.set(null);
    this._companyBanks.set([]);
    this._totalRecords.set(0);
    this._pageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
    this._pageSize.set(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
  }
}
