import { Injectable, signal, computed } from '@angular/core';
import { ProfileBanks, ProfileBanksTable } from 'src/app/core/models';

@Injectable({ providedIn: 'root' })
export class BanksAccountsStore {

  private _accounts = signal<ProfileBanks[]>([]);
  private _tables = signal<ProfileBanksTable | null>(null);
  private _loading = signal(false);

  accounts = computed(() => this._accounts());
  tables = computed(() => this._tables());
  loading = computed(() => this._loading());

  setAccounts(data: ProfileBanks[]) {
    this._accounts.set(data ?? []);
  }

  updateAccount(updated: ProfileBanks) {
    this._accounts.update(accounts =>
      accounts.map(acc =>
        acc.id === updated.id ? { ...updated } : acc
      )
    );
  }

  removeAccount(id: number) {
    this._accounts.update(accounts =>
      accounts.filter(acc => acc.id !== id)
    );
  }

  setTables(data: ProfileBanksTable) {
    this._tables.set(data ?? null);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  clear() {
    this._accounts.set([]);
    this._tables.set(null);
  }
}
