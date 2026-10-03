import { computed, Injectable, signal } from "@angular/core";
import { Company, CompanyTable } from "src/app/core/models";

@Injectable({ providedIn: 'root' })
export class CompanyStore {

  private _original = signal<Company | null>(null);
  private _company = signal<Company | null>(null);
  private _tables = signal<CompanyTable | null>(null);
  private _editMode = signal(false);
  private _loading = signal(false);

  readonly company = this._company.asReadonly();
  readonly tables = this._tables.asReadonly();
  readonly editMode = this._editMode.asReadonly();
  readonly loading = this._loading.asReadonly();

  hasCompany = computed(() => !!this._company());
  hasTables = computed(() => !!this._tables());

  hasChanges = computed(() => {
    const c = this._company();
    const o = this._original();
    if (!c || !o) return false;

    return Object.keys(c).some(
      key => (c as any)[key] !== (o as any)[key]
    );
  });

  setCompany(company: Company) {
    this._original.set(structuredClone(company));
    this._company.set(structuredClone(company));
  }

  setTables(tables: CompanyTable) {
    this._tables.set(tables);
  }

  update(partial: Partial<Company>) {
    this._company.update(c => c ? ({ ...c, ...partial }) : c);
  }

  enableEdit() {
    this._editMode.set(true);
  }

  cancelEdit() {
    this._company.set(structuredClone(this._original()));
    this._editMode.set(false);
  }

  commitEdit() {
    this._original.set(structuredClone(this._company()));
    this._editMode.set(false);
  }

  setLoading(value: boolean) {
    this._loading.set(value);
  }

  reset() {
    this._editMode.set(false);
  }

}