import { Injectable, signal, computed } from '@angular/core';
import { EmailTemplate } from 'src/app/core/models/settings/email.model';

@Injectable({ providedIn: 'root' })
export class EmailsStore {

  private _items = signal<EmailTemplate[] | null>(null);
  private _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();

  hasData = computed(() => !!this._items()?.length);

  set(items: EmailTemplate[]) {
    this._items.set(structuredClone(items));
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  add(item: EmailTemplate) {
    this._items.set([...(this._items() ?? []), item]);
  }

  update(item: EmailTemplate) {
    this._items.set(
      (this._items() ?? []).map(i => i.id === item.id ? item : i)
    );
  }

  remove(id: number) {
    this._items.set((this._items() ?? []).filter(i => i.id !== id));
  }
}
