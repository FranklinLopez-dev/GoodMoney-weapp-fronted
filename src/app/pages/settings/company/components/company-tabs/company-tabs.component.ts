import { Component, inject, signal, ViewChild } from "@angular/core";
import { CompanyStore } from "../../company.store";
import { MaterialModule } from "src/app/material.module";
import { TablerIconsModule } from "angular-tabler-icons";
import { CompanyGeneralComponent } from './tabs/company-general/company-general.component';
import { CompanyLocationComponent } from './tabs/company-location/company-location.component';
import { CompanyContactComponent } from './tabs/company-contact/company-contact.component';
import { CompanyService } from "../../company.service";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs/operators";

@Component({
  standalone: true,
  imports: [MaterialModule, TablerIconsModule,
    CompanyGeneralComponent, CompanyLocationComponent, CompanyContactComponent],
  selector: 'company-tabs',
  templateUrl: './company-tabs.component.html'
})
export class CompanyTabsComponent {

  @ViewChild(CompanyGeneralComponent) generalTab!: CompanyGeneralComponent;
  @ViewChild(CompanyLocationComponent) locationTab!: CompanyLocationComponent;
  @ViewChild(CompanyContactComponent) contactTab!: CompanyContactComponent;

  activeTabIndex = 0;

  public store = inject(CompanyStore);
  public companyService = inject(CompanyService);
  loading = signal(false);

  constructor(private toastr: ToastrService) {}

  handleTabChange(proposedIndex: number) {
    this.saveCurrentTabData();
    this.activeTabIndex = proposedIndex;
  }

  public areAllFormsValid(): boolean {
    return (
      this.generalTab?.form.valid &&
      this.locationTab?.form.valid &&
      this.contactTab?.form.valid
    );
  }

  private markAllFormsTouched() {
    this.generalTab?.markAllAsTouched();
    this.locationTab?.markAllAsTouched();
    this.contactTab?.markAllAsTouched();
  }

  private saveCurrentTabData() {
    const tabs = [
      () => { this.generalTab?.save(); this.locationTab?.save(); },
      () => this.contactTab?.save(),
    ];
    tabs[this.activeTabIndex]?.();
  }

  save() {
    if (this.loading()) return;

    this.saveCurrentTabData();
    if (!this.areAllFormsValid()) {
      this.markAllFormsTouched();
      return;
    }

    if (!this.store.hasChanges()) {
      this.store.commitEdit();
      return;
    }

    const payload = this.store.company();
    if (!payload) return;

    this.loading.set(true);
    this.companyService.update(payload).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response) => {
        if (response === 'OK') {
          this.toastr.success('Empresa editada correctamente', 'Éxito');
          this.store.commitEdit();
        }
      }
    });
  }


}