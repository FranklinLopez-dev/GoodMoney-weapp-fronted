import { Injectable, signal, computed } from '@angular/core';
import { Company } from 'src/app/core/models';

@Injectable({
  providedIn: 'root',
})
export class AuthCompanyStore {
  private _company = signal<Company | null>(null);

  readonly company = this._company.asReadonly();

  readonly hasCompany = computed(() => !!this._company());
  readonly appIosUrl = computed(() => this._company()?.appIosUrl ?? null);
  readonly appAndroidUrl = computed(() => this._company()?.appAndroidUrl ?? null);
  readonly webSite = computed(() => this._company()?.webSite);

  setCompany(company: Company | null): void {
    this._company.set(company);
  }

  clear(): void {
    this._company.set(null);
  }
}
