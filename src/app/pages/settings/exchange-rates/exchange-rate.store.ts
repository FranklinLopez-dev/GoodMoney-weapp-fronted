import { Injectable } from '@angular/core';
import { ExchangeRate } from 'src/app/core/models';
import { ListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class ExchangeRateStore extends ListStore<ExchangeRate> {

  private _cache = new Map<string, ExchangeRate[]>();

  private buildKey(from: string, to: string): string {
    return `${from}|${to}`;
  }

  getFromCache(from: string, to: string): ExchangeRate[] | null {
    return this._cache.get(this.buildKey(from, to)) ?? null;
  }

  setToCache(from: string, to: string, data: ExchangeRate[]) {
    this._cache.set(this.buildKey(from, to), structuredClone(data));
  }

  override clear() {
    super.clear();
    this._cache.clear();
  }
}
