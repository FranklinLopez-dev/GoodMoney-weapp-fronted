import {
  Injectable,
  signal,
  computed
} from '@angular/core';

import {
  OperationTable
} from 'src/app/core/models/operations/operations.model';

import {
  Coupons,
  Profile,
  ProfileBanks
} from 'src/app/core/models';

import { FormGroup } from '@angular/forms';
type ProfileMode = 'view' | 'edit' | 'create-natural' | 'create-juridico' | 'novodivisas' | 'accounts';

@Injectable({ providedIn: 'root' })
export class NovodivisasStore {


  private _table = signal<OperationTable | null>(null);
  private _loading = signal(false);

  readonly table = computed(() => this._table());
  readonly loading = computed(() => this._loading());


  private _form = signal<FormGroup | null>(null);
  readonly form = computed(() => this._form());

  setForm(form: FormGroup): void {
    this._form.set(form);
  }

  get formValue() {
    return this._form()?.value;
  }

  clearForm() {
    this._form.set(null);
  }

  private _profile = signal<Profile | null>(null);
  readonly profile = computed(() => this._profile());

  setProfile(profile: Profile): void {
    this._profile.set(structuredClone(profile));
  }

  applyProfileToForm(profile: Profile | null): void {
    const profileForm = this._form()?.get('profile') as FormGroup;
    if (!profileForm) return;

    profileForm.patchValue({
      names: profile?.names ?? null,
      lastNames: profile?.lastNames ?? null,
      address: profile?.address ?? null,
    }, { emitEvent: false });
  }

  clearProfile(): void {
    this._profile.set(null);
  }


  private _bankAccounts = signal<ProfileBanks[]>([]);
  readonly bankAccounts = computed(() => this._bankAccounts());

  setBankAccounts(accounts: ProfileBanks[]): void {
    this._bankAccounts.set(structuredClone(accounts));
  }

  updateBankAccount(account: ProfileBanks): void {
    this._bankAccounts.update(list =>
      list.map(a => a.id === account.id ? { ...account } : a)
    );
  }

  removeBankAccount(id: number): void {
    this._bankAccounts.update(list =>
      list.filter(a => a.id !== id)
    );
  }

  clearBankAccounts(): void {
    this._bankAccounts.set([]);
  }


  private _mode = signal<ProfileMode>('novodivisas');
  readonly mode = this._mode.asReadonly();

  setMode(mode: ProfileMode) {
    this._mode.set(mode);
  }

setTable(table: OperationTable): void {
    this._table.set(structuredClone(table));
  }

  clearTable(): void {
    this._table.set(null);
  }


  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  clearAll(): void {
    this._form.set(null);
    this._profile.set(null);
    this._bankAccounts.set([]);
    this._table.set(null);
    this._mode.set('novodivisas');
  }

  removeAccount(id: number) {
    this._bankAccounts.update(accounts =>
      accounts.filter(acc => acc.id !== id)
    );
  }

}
