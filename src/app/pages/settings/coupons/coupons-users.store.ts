import { Injectable, signal, computed } from '@angular/core';
import { Users } from 'src/app/core/models';

@Injectable({ providedIn: 'root' })
export class CouponsUsersStore {

  private _users = signal<Users[] | null>(null);
  private _loading = signal(false);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();

  hasData = computed(() => !!this._users()?.length);

  set(users: Users[]) {
    this._users.set(structuredClone(users));
  }

  clear() {
    this._users.set(null);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }
}