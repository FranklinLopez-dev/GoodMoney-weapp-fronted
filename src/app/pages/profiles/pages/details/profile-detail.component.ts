import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { Profile } from 'src/app/core/models';
import { ProfilesStore } from '../../profiles.store';
import { ProfilesTablesStore } from '../../tables/profiles-tables.store';
import { ProfileReadonlyComponent } from './components/profile-readonly/profile-readonly.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { JuridicoIdentidadSectionComponent } from './components/profile-form/sections/juridico/juridico-identidad/juridico-identidad.section';
import { NaturalIdentidadSectionComponent } from './components/profile-form/sections/natural/natural-identidad/natural-identidad.section';
import { AddressSectionComponent } from './components/profile-form/sections/address/address.section';
import { JuridicoRepresentativeSectionComponent } from './components/profile-form/sections/juridico/juridico-representative/juridico-representative.section';
import { NaturalPepSectionComponent } from './components/profile-form/sections/natural/natural-pep/natural-pep.section';
import { ContactSectionComponent } from './components/profile-form/sections/contact/contact.section';
import { DocumentationSectionComponent } from './components/profile-form/sections/documentation/documentation.section';

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
    DocumentationSectionComponent
  ],
  templateUrl: './profile-detail.component.html'
})
export class ProfileDetailComponent {

  private router = inject(Router);
  private profilesStore = inject(ProfilesStore);
  private tablesStore = inject(ProfilesTablesStore);

  profile = this.profilesStore.current;
  tables = this.tablesStore.tables;
  mode = this.profilesStore.mode;

  isCreate = computed(() => this.profile() === null);
  isEdit = computed(() => this.mode() === 'edit');
  isView = computed(() => this.mode() === 'view');

  isJuridico = computed(() => {
    if (this.isCreate()) return true;
    return !this.profile()?.documentTypeIsNatural;
  });

  title = computed(() => {
    if (this.isCreate()) return 'Nuevo Perfil Jurídico';
    if (this.isEdit()) return 'Editar Perfil';
    return 'Detalle del perfil';
  });

  constructor() {
    if (this.isCreate()) {
      this.profilesStore.setMode('create-juridico');
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
      this.router.navigate(['/profiles']);
      return;
    }
    this.profilesStore.setMode('view');
  }

  back(): void {
    this.router.navigate(['/profiles']);
  }

  onSaved(profile: Profile): void {
    this.profilesStore.setCurrent(profile);
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
}
