import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { Profile } from 'src/app/core/models';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfileReadonlyComponent } from 'src/app/pages/profiles/pages/details/components/profile-readonly/profile-readonly.component';
import { ProfileFormComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/profile-form.component';
import { JuridicoIdentidadSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/juridico/juridico-identidad/juridico-identidad.section';
import { NaturalIdentidadSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/natural/natural-identidad/natural-identidad.section';
import { AddressSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/address/address.section';
import { JuridicoRepresentativeSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/juridico/juridico-representative/juridico-representative.section';
import { NaturalPepSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/natural/natural-pep/natural-pep.section';
import { ContactSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/contact/contact.section';
import { DocumentationSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/documentation/documentation.section';
import { ProfilesUserStore } from '../profiles.store';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';
import { BanksAccountsProfileComponent } from 'src/app/pages/profiles/pages/details/components/accounts/accounts.component';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [
    ProfileReadonlyComponent,
    MaterialModule,
    TablerIconsModule,
    ProfileFormComponent,
    JuridicoIdentidadSectionComponent,
    NaturalIdentidadSectionComponent,
    AddressSectionComponent,
    JuridicoRepresentativeSectionComponent,
    NaturalPepSectionComponent,
    ContactSectionComponent,
    DocumentationSectionComponent,
    BanksAccountsProfileComponent
  ],
  templateUrl: './profiles-details.component.html'
})
export class ProfileDetailComponent {

  private router = inject(Router);
  private profilesStore = inject(ProfilesUserStore);
  private tablesStore = inject(ProfilesTablesStore);
  private accounst = inject(BanksAccountsService);

  profile = this.profilesStore.current;
  tables = this.tablesStore.tables;
  mode = this.profilesStore.mode;

  currentId = computed(() => this.profilesStore.currentId());
  isCreate = computed(() => this.profile() === null);
  isEdit = computed(() => this.mode() === 'edit');
  isView = computed(() => this.mode() === 'view');
  isAccounts = computed(() => this.mode() === 'accounts');

  isJuridico = computed(() => {
    if (this.isCreate()) return true;
    return !this.profile()?.documentTypeIsNatural;
  });

  title = computed(() => {
    if (this.isCreate()) return 'Nuevo Perfil Jurídico';
    if (this.isEdit()) return 'Editar Perfil';
    if (this.isAccounts()) return 'Cuentas Bancarias: ' + this.profile()?.names ;
    return 'Detalle del perfil';
  });

  constructor() {
    if (this.isCreate()) {
      this.profilesStore.setMode('create');
    } else {
      this.profilesStore.setMode('view');
    }
  }

  edit(): void {
    this.profilesStore.setMode('edit');
  }

  cancel(): void {
    this.step.set(0);
    if (this.isCreate()) {
      this.router.navigate(['security/users', this.currentId()]);
      return;
    }
    this.profilesStore.setMode('view');
  }

  back(): void {
    this.router.navigate(['security/users', this.currentId()]);
  }

  onSaved(profile: Profile): void {
    this.profilesStore.setCurrent(profile, this.currentId()!);
    this.profilesStore.setMode('view');
    this.step.set(0);
  }

  step = signal(0);

  setStep(index: number) {
    this.step.set(index);
  }

  nextStep() {
    this.step.update(i => i + 1);
  }

  prevStep() {
    this.step.update(i => i - 1);
  }

  loadAccountsBank() {
    this.accounst.getAllId(this.profile()?.id!).subscribe(accounts => {
      this.profilesStore.setAccounts(accounts);
      this.profilesStore.setMode('accounts');
    });
  }

}
