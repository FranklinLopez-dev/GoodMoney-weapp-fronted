import { Injectable, computed, signal } from '@angular/core';
import { Coupons } from 'src/app/core/models';

@Injectable({ providedIn: 'root' })
export class CouponsStore {
  private _items = signal<Coupons[] | null>(null);
  private _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  hasData = computed(() => !!this._items()?.length);

  set(items: Coupons[]) {
    this._items.set(structuredClone(items));
  }

  add(item: Coupons) {
    const current = this._items() ?? [];
    this._items.set([...current, item]);
  }

  update(id: number, item: Partial<Coupons>) {
    const current = this._items() ?? [];
    const index = current.findIndex(x => x.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...item };
      this._items.set([...current]);
    }
  }

  remove(id: number) {
    const current = this._items() ?? [];
    this._items.set(current.filter(x => x.id !== id));
  }

  clear() {
    this._items.set(null);
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }
}
