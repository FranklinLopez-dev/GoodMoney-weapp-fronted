import { Injectable, computed, signal } from '@angular/core';
import { Profile, ProfileBanks, Users } from 'src/app/core/models';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
type ProfileMode = 'view' | 'edit' | 'create' | 'accounts';

@Injectable({ providedIn: 'root' })
export class ProfilesUserStore {

  private _itemsById = signal<Record<string, Profile[]>>({});
  private _currentId = signal<string | null>(null);
  private _current = signal<Profile | null>(null);
  private _mode = signal<ProfileMode>('view');
  private _user = signal<Users | null>(null);

  private _loading = signal(false);
  private _totalRecords = signal(0);
  private _pageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);

  readonly loading = this._loading.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly pageIndex = this._pageIndex.asReadonly();
  readonly currentId = this._currentId.asReadonly();
  readonly user = this._user.asReadonly();
  readonly current = this._current.asReadonly();
  readonly mode = this._mode.asReadonly();

  readonly items = computed(() => {
    const id = this._currentId();
    return id ? this._itemsById()[id] ?? [] : [];
  });

  hasDataFor(userId: string) {
    return this._itemsById()[userId]?.length > 0;
  }

  setUser(user: Users) {
    this._user.set(user);
  }

  setMode(mode: ProfileMode) {
    this._mode.set(mode);
  }

  setCurrent(profile: Profile | null, userId?: string) {
    this._current.set(profile);
    if (userId) this._currentId.set(userId);
  }

  findById(userId: string, profileId: number): Profile | null {
    return this._itemsById()[userId]?.find(p => p.id === profileId) ?? null;
  }

  set(userId: string, items: Profile[]) {
    this._itemsById.update(state => ({
      ...state,
      [userId]: structuredClone(items)
    }));
    this._currentId.set(userId);
  }

  setPagination(totalRecords: number, pageIndex: number) {
    this._totalRecords.set(totalRecords);
    this._pageIndex.set(pageIndex);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  clearAll() {
    this._itemsById.set({});
    this._currentId.set(null);
    this._current.set(null);
    this._bankAccounts.set([]);
    this._user.set(null);
    this._totalRecords.set(0);
    this._pageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
  }

  private _bankAccounts = signal<ProfileBanks[]>([]);
  readonly bankAccounts = computed(() => this._bankAccounts());

  setAccounts(accounts: ProfileBanks[]): void {
    this._bankAccounts.set(structuredClone(accounts));
  }

  updateAccount(updated: ProfileBanks) {
    this._bankAccounts.update(accounts =>
      accounts.map(acc =>
        acc.id === updated.id ? { ...updated } : acc
      )
    );
  }

  removeAccount(id: number) {
    this._bankAccounts.update(accounts =>
      accounts.filter(acc => acc.id !== id)
    );
  }

}