import { Injectable, computed, signal } from '@angular/core';
import { Profile, Profiles } from 'src/app/core/models';
type ProfileMode = 'view' | 'edit' | 'create-juridico';

@Injectable({ providedIn: 'root' })
export class ProfilesStore {

  private _items = signal<Profiles[] | null>(null);
  private _current = signal<Profile | null>(null);
  private _mode = signal<ProfileMode>('view');
  private _loading = signal(false);

  readonly items = this._items.asReadonly();
  readonly current = this._current.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly mode = this._mode.asReadonly();

  readonly hasData = computed(() => !!this._items()?.length);

  set(items: Profiles[]): void {
    this._items.set(structuredClone(items));
  }

  setMode(mode: ProfileMode): void {
    this._mode.set(mode);
  }

  setCurrent(profile: Profile | null) {
    this._current.set(profile);
  }

  findById(id: number): Profiles | null {
    return this._items()?.find(p => p.profile.id === id) ?? null;
  }

  clear(): void {
    this._items.set(null);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

}
