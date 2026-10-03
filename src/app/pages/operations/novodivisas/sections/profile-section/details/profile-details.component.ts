import { Component, computed, inject, signal } from '@angular/core';
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
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { NovodivisasStore } from '../../../novodivisas.store';
import { BanksAccountsProfileComponent } from 'src/app/pages/profiles/pages/details/components/accounts/accounts.component';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';

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
  templateUrl: './profile-details.component.html'
})
export class ProfileDetailComponent {

  private profilesStore = inject(NovodivisasStore);
  private tablesStore = inject(ProfilesTablesStore);
  private accounst = inject(BanksAccountsService);

  profile = this.profilesStore.profile;
  tables = this.tablesStore.tables;
  mode = this.profilesStore.mode;

  isCreate = computed(() => this.profile() === null);
  isEdit = computed(() => this.mode() === 'edit');
  isView = computed(() => this.mode() === 'view');
  isAccounts = computed(() => this.mode() === 'accounts');

  title = computed(() => {
    if (this.isCreate()) {
      if (this.mode() === 'create-natural') {
        return 'Nuevo Perfil Natural';
      } else {
        return 'Nuevo Perfil Jurídico';
      }
    }
    if (this.isEdit()) return 'Editar Perfil';
    if (this.isAccounts()) return 'Cuentas Bancarias: ' + this.profile()?.names ;
    return 'Detalle del perfil';
  });

  constructor() {
    if (this.isCreate()) {
      if (this.mode() === 'create-natural') {
        this.profilesStore.setMode('create-natural');
      } else {
        this.profilesStore.setMode('create-juridico');
      }

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
      this.profilesStore.setMode('novodivisas');
    } else {
      this.profilesStore.setMode('view');
    }
  }

  back(): void {
    this.step.set(0);
    this.profilesStore.setMode('novodivisas');
  }

  onSaved(profile: Profile | null): void {
    this.profilesStore.setProfile(profile!);
    if (profile) {
      this.profilesStore.setMode('view');
    } else {
      this.profilesStore.setMode('novodivisas');
    }
    this.profilesStore.applyProfileToForm(profile);
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
      this.profilesStore.setBankAccounts(accounts);
      this.profilesStore.setMode('accounts');
    });
  }

}
