import { computed, Injectable, signal } from "@angular/core";
import { Serie } from "src/app/core/models";

@Injectable({ providedIn: 'root' })
export class SeriesStore {

  private readonly _series = signal<Serie[]>([]);
  private readonly _loading = signal(false);

  readonly series  = this._series.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly hasSeries = computed(() => this._series().length > 0);

  set(series: Serie[]) {
    this._series.set(structuredClone(series));
  }

  add(item: Serie) {
    this._series.update(list => [...list, item]);
  }

  update(item: Serie) {
    this._series.update(list =>
      list.map(s => s.id === item.id ? item : s)
    );
  }

  remove(id: number) {
    this._series.update(list =>
      list.filter(s => s.id !== id)
    );
  }

  clear() {
    this._series.set([]);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }
}
