import { Injectable, computed, signal } from '@angular/core';
import { Profile, ProfileBanks } from 'src/app/core/models';
import { PagedListStore } from 'src/app/core/stores/crud.store';
type ProfileMode = 'view' | 'edit' | 'profiles' | 'accounts';

@Injectable({ providedIn: 'root' })
export class AssignProfilesStore extends PagedListStore<Profile> {

  private _mode = signal<ProfileMode>('profiles');
  readonly mode = this._mode.asReadonly();

  private _isEdit = signal(false);
  readonly isEdit = this._isEdit.asReadonly();

  private _profile = signal<Profile | null>(null);
  readonly profile = computed(() => this._profile());

  private _bankAccounts = signal<ProfileBanks[]>([]);
  readonly bankAccounts = computed(() => this._bankAccounts());

  setMode(mode: ProfileMode) {
    this._mode.set(mode);
  }

  setEdit(mode: boolean) {
    this._isEdit.set(mode);
  }

  setProfile(profile: Profile): void {
    this._profile.set(structuredClone(profile));
  }

  setBankAccounts(accounts: ProfileBanks[]): void {
    this._bankAccounts.set(structuredClone(accounts));
  }

  clearAll() {
    this.clear();
    this._profile.set(null);
    this._bankAccounts.set([]);
    this._mode.set('profiles');
    this._isEdit.set(false);
  }
}
