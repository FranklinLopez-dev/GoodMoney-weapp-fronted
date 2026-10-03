import { Component, computed, Inject, inject, Input, Optional, signal } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { Profile, RucResponse, Ubigeo } from 'src/app/core/models';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { environment } from 'src/environments/environment';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CountryService } from 'src/app/shared/services/country.service';
import { of, switchMap } from 'rxjs';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ProfilesStore } from 'src/app/pages/profiles/profiles.store';
import { FileItem } from 'src/app/shared/model/file.model';
import { FileCardComponent } from 'src/app/shared/components/file-card/file-card.component';
import { ProfilesUserStore } from 'src/app/pages/security/users/profiles/profiles.store';
import { NovodivisasStore } from 'src/app/pages/operations/novodivisas/novodivisas.store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssignProfilesStore } from 'src/app/pages/security/assign-profiles/assign-profiles.store';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';
type ProfileContext = 'client' | 'admin' | 'novodivisas' | 'assign-profiles';

@Component({
  selector: 'app-profile-readonly',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, 
    MaterialModule,
    TablerIconsModule,
    FallbackImgDirective,
    FileCardComponent
  ],
  templateUrl: './profile-readonly.component.html'
})
export class ProfileReadonlyComponent {

  @Input({ required: true }) context!: ProfileContext;

  private profilesStore = inject(ProfilesStore);
  private profilesUserStore = inject(ProfilesUserStore);
  private novodivisasStore = inject(NovodivisasStore);
  private assignProfilesStore = inject(AssignProfilesStore);
  private countryService = inject(CountryService);
  private ubigeosService = inject(UbigeosService);
  private authService = inject(AuthService);
  public store = inject(ProfilesTablesStore);
  private modalProfile = signal<Profile | null>(null);

  baseUrl = environment.apiUrl;
  countries = this.countryService.countries;

  profile = computed(() => {
  if (this.isModal) {
    return this.modalProfile();
  }

  return this.context === 'admin'
    ? this.profilesUserStore.current()
    : this.context === 'client'
      ? this.profilesStore.current()
      : this.context === 'novodivisas' ? this.novodivisasStore.profile() 
        : this.assignProfilesStore.profile();

});

  private profile$ = toObservable(this.profile);

  constructor(
    @Optional() public dialogRef: MatDialogRef<ProfileReadonlyComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) { 
    if(this.isModal && this.data) {
      this.modalProfile.set(this.data);
    }
  }

  get isModal(): boolean {
    return !!this.dialogRef;
  }

  departments = computed(() =>
    this.store.tables()?.departaments ?? []
  );

  get profileType(): string {
    return this.profile()?.documentTypeIsNatural
      ? 'Perfil Natural'
      : 'Perfil Jurídico';
  }

  get fullName(): string {
    if (this.profile()?.documentTypeIsNatural) {
      return `${this.profile()?.names} ${this.profile()?.lastNamePaterno} ${this.profile()?.lastNameMaterno}`;
    }
    return this.profile()?.names ?? '-';
  }

  get fullNameRep(): string {
    return `${this.profile()?.namesRep} ${this.profile()?.lastNamePaternoRep} ${this.profile()?.lastNameMaternoRep}`;
  }

  get documentLabel(): string {
    return `${this.profile()?.documentTypeName}: ${this.profile()?.documentNumber}`;
  }

  get documentLabelRep(): string {
    return `${this.profile()?.documentTypeRepName}: ${this.profile()?.documentNumberRep}`;
  }

  selectedCountry = computed(() => {
    const countries = this.countries();

    if (!this.profile()?.country || !countries?.length) return null;
    return countries.find(c => c.cca2 === this.profile()?.country.toUpperCase()) ?? null;
  });

  selectedDepartament = computed(() => {
    const departments = this.departments();

    if (!this.profile()?.departament || !departments?.length) return null;
    return departments.find(d => d.code === this.profile()?.departament) ?? null;
  });

  provinces = toSignal<Ubigeo[]>(
    this.profile$.pipe(
      switchMap(profile =>
        profile?.departament
          ? this.ubigeosService.getProvinces(profile.departament)
          : of([])
      )
    )
  );

  selectedProvince = computed(() => {
    const provinces = this.provinces();

    if (!this.profile()?.province || !provinces?.length) return null;
    return provinces.find(p => p.code === this.profile()?.province) ?? null;
  });

  districts = toSignal<Ubigeo[]>(
    this.profile$.pipe(
      switchMap(profile =>
        profile?.province
          ? this.ubigeosService.getDistricts(profile.province)
          : of<Ubigeo[]>([])
      )
    )
  );

  selectedDistrict = computed(() => {
    const districts = this.districts();

    if (!this.profile()?.district || !districts?.length) return null;
    return districts.find(d => d.code === this.profile()?.district) ?? null;
  });

  rucResponse = toSignal<RucResponse | null>(
    this.profile$.pipe(
      switchMap(profile =>
        profile?.documentTypeIsNatural === false && profile.documentNumber
          ? this.authService.getRuc(profile.documentNumber)
          : of(null)
      )
    )
  );

  documents = computed<FileItem[]>(() => {
    const p = this.profile();
    if (!p) return [];

    const files: FileItem[] = [];

    if (p.documentTypeIsNatural) {
      if (p.documentPhotoFront) {
        files.push({
          label: 'DNI Frontal',
          name: this.getFileName(p.documentPhotoFront),
          url: p.documentPhotoFront,
          type: 'PNG',
        });
      }

      if (p.documentPhotoReverse) {
        files.push({
          label: 'DNI Reverso',
          name: this.getFileName(p.documentPhotoReverse),
          url: p.documentPhotoReverse,
          type: 'PNG',
        });
      }
    } else {
      if (p.documentPhotoFront) {
        files.push({
          label: 'Ficha RUC',
          name: this.getFileName(p.documentPhotoFront),
          url: p.documentPhotoFront,
          type: 'PDF',
        });
      }

      if (p.documentPhotoReverse) {
        files.push({
          label: 'Documentación',
          name: this.getFileName(p.documentPhotoReverse),
          url: p.documentPhotoReverse,
          type: 'PDF',
        });
      }
    }

    return files;
  });

  private getFileName(path: string): string {
    return path.split('/').pop() ?? path;
  }

}
