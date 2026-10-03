import { Injectable, inject, signal, computed } from '@angular/core';
import { Dashboard } from 'src/app/core/models';
import { UtilsService } from 'src/app/core/services/common/utils.service';

@Injectable()
export class DashboardStore {

  private utils = inject(UtilsService);
  private company = this.utils.company;

  private _dashboard = signal<Dashboard | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  private now = new Date();
  private firstDayOfMonth = new Date(
    this.now.getFullYear(),
    this.now.getMonth(),
    1
  );

  private _filterType = signal<number>(3);
  private _tabOperations = signal<number>(1);
  private _extraParams = signal<any>({month: this.firstDayOfMonth});

  private _cache = new Map<string, Dashboard>();

  readonly dashboard = this._dashboard.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly kpiCompras = computed(() => this._dashboard()?.totalCompras ?? null);
  readonly kpiVentas = computed(() => this._dashboard()?.totalVenta ?? null);
  readonly kpiUsers = computed(() => this._dashboard()?.totalUsers ?? null);
  readonly operationsChart = computed(() => this._dashboard()?.totalOperaciones ?? null);
  readonly exchangeRates = computed(() => this._dashboard()?.listExchageRates ?? null);
  readonly exchangeRate = computed(() => this._dashboard()?.exchangeRate ?? null);
  readonly rankingUsers = computed(() => this._dashboard()?.rankigUsers ?? []);
  readonly isAdmin = computed(() => this._dashboard()?.isAdmin ?? false);


  private buildKey(filter: number, tab: number, extra: any) {
    return JSON.stringify({
      c: this.company()?.id,
      f: filter,
      t: tab,
      e: extra
    });
  }

  private currentKey() {
    return this.buildKey(
      this._filterType(),
      this._tabOperations(),
      this._extraParams()
    );
  }

  async load(force = false) {
    const key = this.currentKey();
    const cached = this._cache.get(key);

    if (!force && cached) {
      this._dashboard.set(cached);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await this.utils.getDashboard(
        this._filterType(),
        this._tabOperations(),
        this._extraParams()
      );

      this._cache.set(key, data);
      this._dashboard.set(data);

    } catch {
      this._error.set('Error al cargar dashboard');
    } finally {
      this._loading.set(false);
    }
  }

  updateFilters(filter: number, tab: number, extra: any = {}) {
    this._filterType.set(filter);
    this._tabOperations.set(tab);
    this._extraParams.set(extra);
    this.load();
  }

  forceRefresh() {
    this.load(true);
  }

  clearCache() {
    this._cache.clear();
    this._dashboard.set(null);
  }
}
