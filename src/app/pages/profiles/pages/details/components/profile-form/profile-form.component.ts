import { aFechaApi } from 'src/app/shared/utils/fechas';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  OnInit
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { Profile } from 'src/app/core/models';
import { finalize, tap } from 'rxjs';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { ToastrService } from 'ngx-toastr';
import { ProfilesStore } from 'src/app/pages/profiles/profiles.store';
import { Router } from '@angular/router';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { ProfilesRealtimeService } from 'src/app/pages/profiles/profiles-realtime.service';
type ProfileContext = 'client' | 'admin';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './profile-form.component.html'
})
export class ProfileFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private service = inject(ProfilesService);
  private store = inject(ProfilesStore);
  private realtime = inject(ProfilesRealtimeService);   

  @Input({ required: true }) mode!: string;
  @Input() profile: Profile | null = null;
  @Input({ required: true }) context!: ProfileContext;

  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Profile>();

  saving = false;

  readonly isCreate = computed(() =>
    this.mode === 'create-natural' || this.mode === 'create-juridico'
  );

  readonly isEdit = computed(() =>
    this.mode === 'edit'
  );

  readonly isNatural = computed(() =>
    this.mode === 'create-natural'
    || (!!this.profile && this.profile.documentTypeIsNatural)
  );

  readonly isJuridico = computed(() =>
    this.mode === 'create-juridico'
    || (!!this.profile && !this.profile.documentTypeIsNatural)
  );

  juridicoForm = this.fb.group({
    id: [null],
    applicationUserId: [0],
    country: ['PE', Validators.required],
    documentTypeId: [null, Validators.required],
    documentTypeRepId: [null, Validators.required],
    documentNumber: [null, Validators.required],
    documentNumberRep: [null, Validators.required],
    names: [null, Validators.required],
    namesRep: [null, Validators.required],
    lastNamePaternoRep: [null, Validators.required],
    lastNameMaternoRep: [null, Validators.required],
    activityId: [null, Validators.required],
    positionId: [null, Validators.required],
    departament: [null, Validators.required],
    province: [null, Validators.required],
    district: [null, Validators.required],
    address: [null, Validators.required],
    email: [null, [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
    phone: [null],
    cellPhone: [null, Validators.required],
    flagEmail: [false],
    flagCellPhone: [false],
    isWhatsapp: [false],
    dateOfBirth: [null, Validators.required],
    profilePhoto: [null],
    profilePhotoByte: [null],
    documentPhotoFrontByte: [null],
    documentPhotoReverseByte: [null],
    documentPhotoFront: [null],
    documentPhotoReverse: [null],
    documentPhotoFrontName: [null],
    documentPhotoReverseName: [null],
    status: [true, Validators.requiredTrue],
    isValidate: [true],
    isAdmin: [false],
    // Alias con el que el cliente ve a este asesor en el chat. Vacío = el API compone "Asesor 1", "Asesor 2"…
    nickname: [null],
    flagCheck: [false],
    isValidateEmail: [false],
    isValidateCellPhone: [false],
    isFormIndividual: [false],
    typeOnline: ['online'],
    isMe: [true],
    isBlackListed: [false]
  });

  naturalForm = this.fb.group({
    id: [null],
    applicationUserId: [null],
    country: ['PE', Validators.required],
    documentTypeId: [null, Validators.required],
    documentNumber: [null, Validators.required],
    names: [null, Validators.required],
    lastNamePaterno: [null, Validators.required],
    lastNameMaterno: [null, Validators.required],
    positionId: [null, Validators.required],
    isPep: [false],
    institution: [null],
    cargo: [null],
    parientesPep: this.fb.array([]),
    isFamiliarPep: [false],
    parientesFamiliarPep: this.fb.array([]),
    departament: [null, Validators.required],
    province: [null, Validators.required],
    district: [null, Validators.required],
    address: [null, Validators.required],
    email: [null, [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
    phone: [null],
    cellPhone: [null, Validators.required],
    flagEmail: [false],
    flagCellPhone: [false],
    isWhatsapp: [false],
    statusCivil: [null],
    dateOfBirth: [null, Validators.required],
    profilePhoto: [null],
    profilePhotoByte: [null],
    documentPhotoFrontByte: [null],
    documentPhotoReverseByte: [null],
    documentPhotoFront: [null],
    documentPhotoReverse: [null],
    documentPhotoFrontName: [null],
    documentPhotoReverseName: [null],
    isValidate: [true],
    isAdmin: [false],
    // Alias con el que el cliente ve a este asesor en el chat. Vacío = el API compone "Asesor 1", "Asesor 2"…
    nickname: [null],
    flagCheck: [false],
    isValidateEmail: [false],
    isValidateCellPhone: [false],
    isFormIndividual: [false],
    typeOnline: ['online'],
    isMe: [true],
    isBlackListed: [false]
  });

  constructor(private toaster: ToastrService, private appData: UtilsService) { }

  flagProfile = this.appData.profile;

  private disablePersonalFieldsJuridico(): void {
    const fields = [
      'documentTypeId',
      'documentNumber',
      'names',
      'lastNamePaterno',
      'lastNameMaterno'
    ];

    const form = this.activeForm as any;

    fields.forEach(field => {
      form.get(field)?.disable({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private parseParientesString(value: string): any[] {
    if (!value || typeof value !== 'string') return [];
    return value
      .split('|')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => {
        const [namePart, ...rest] = part.split(',');
        const name = (namePart || '').trim();
        const relationship = (rest.join(',') || '').trim();
        return { names: name, relationship };
      });
  }

  private initializeForm(): void {

    if (this.isCreate()) {
      if (this.isNatural()) {
        this.juridicoForm.disable();
        this.naturalForm.enable();
      } else {
        this.juridicoForm.enable();
        this.naturalForm.disable();
      }
      return;
    }

    if (!this.profile) return;

    if (this.profile.documentTypeIsNatural) {
      const profileForPatch: any = { ...(this.profile as any) };

      if (typeof profileForPatch.parientesPep === 'string') {
        profileForPatch.parientesPep = this.parseParientesString(profileForPatch.parientesPep);
      }

      if (typeof profileForPatch.parientesFamiliarPep === 'string') {
        profileForPatch.parientesFamiliarPep = this.parseParientesString(profileForPatch.parientesFamiliarPep);
      }

      if (profileForPatch.dateOfBirth) {
        profileForPatch.dateOfBirth = new Date(profileForPatch.dateOfBirth);
      }

      this.naturalForm.patchValue(profileForPatch as any);

      const pepArrayControl = this.naturalForm.get('parientesPep') as FormArray;
      pepArrayControl.clear();
      (profileForPatch.parientesPep ?? []).forEach((p: any) => {
        pepArrayControl.push(this.fb.group({ names: [p.names ?? ''], relationship: [p.relationship ?? ''] }));
      });

      const familiarArrayControl = this.naturalForm.get('parientesFamiliarPep') as FormArray;
      familiarArrayControl.clear();
      (profileForPatch.parientesFamiliarPep ?? []).forEach((p: any) => {
        familiarArrayControl.push(this.fb.group({ names: [p.names ?? ''], relationship: [p.relationship ?? ''] }));
      });

      this.naturalForm.get('country')?.setValue(this.profile.country.toUpperCase());
      this.naturalForm.enable();
      this.juridicoForm.disable();
    } else {
      this.juridicoForm.patchValue(this.profile as any);
      this.juridicoForm.get('country')?.setValue(this.profile.country.toUpperCase());
      this.juridicoForm.enable();
      this.naturalForm.disable();
    }
    if(this.context == 'client') {
      this.disablePersonalFieldsJuridico();
    }
  }

  get activeForm() {
    return this.isNatural()
      ? this.naturalForm
      : this.juridicoForm;
  }

  save(): void {
    if (this.activeForm.invalid || this.saving) return;

    this.saving = true;
    const payload: any = this.activeForm.getRawValue();

    if (this.isNatural()) {
      payload.documentTypeIsNatural = true;
      const pepArray: any[] = this.naturalForm.get('parientesPep')?.value ?? [];
      const familiarArray: any[] = this.naturalForm.get('parientesFamiliarPep')?.value ?? [];

      if (payload.isPep && Array.isArray(pepArray) && pepArray.length) {
        payload.parientesPep = pepArray
          .map((item: any) => `${item.names ?? ''}, ${item.relationship ?? ''}`)
          .join(' | ');
      } else {
        payload.parientesPep = null;
      }

      if (payload.isFamiliarPep && Array.isArray(familiarArray) && familiarArray.length) {
        payload.parientesFamiliarPep = familiarArray
          .map((item: any) => `${item.names ?? ''}, ${item.relationship ?? ''}`)
          .join(' | ');
      } else {
        payload.parientesFamiliarPep = null;
      }
    } else {
      payload.documentTypeIsNatural = false;
    }

    payload.dateOfBirth = aFechaApi(new Date(payload.dateOfBirth!));

    if (this.isNatural()) {
      payload.lastNames = payload.lastNamePaterno + ' ' + payload.lastNameMaterno;
    } else {
      payload.lastNamesRep = payload.lastNamePaternoRep + ' ' + payload.lastNameMaternoRep;
    }

    let request$;

    if (this.context == 'client') {
      if (this.isCreate()) {
        payload.applicationUserId = this.flagProfile()?.applicationUserId;
        payload.isFormIndividual = false;
        request$ = this.isNatural()
          ? this.service.createNatural(payload as any)
          : this.service.createJuridico(payload as any);
      } else {
        request$ = this.isNatural()
          ? this.service.updateNatural(payload as any)
          : this.service.updateJuridico(payload as any);
      }
    } else {
      if (this.isCreate()) {
        payload.applicationUserId = this.flagProfile()?.applicationUserId;
        payload.isFormIndividual = true;
        request$ = this.isNatural()
          ? this.service.createNaturalAdmin(payload as any)
          : this.service.createJuridicoAdmin(payload as any);
      } else {
        request$ = this.isNatural()
          ? this.service.updateNaturalAdmin(payload as any)
          : this.service.updateJuridicoAdmin(payload as any);
      }
    }

    request$
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (response) => {
          if (response == 'OK') {
            if (this.isCreate()) {
              this.realtime.addProfileValidate();
              this.toaster.success(
                "Perfil guardado corectamente.",
                "Éxito"
              );
              if (this.context == 'client') {
                this.service.getAll().subscribe({
                  next: profiles => {
                    this.store.set(profiles);
                    this.router.navigate(['/profiles']);
                  }
                });
              } else {
                this.saved.emit(null!);
              }
            } else {
              this.toaster.success(
                "Perfil editado corectamente.",
                "Éxito"
              );
              this.service.getById(payload.id).subscribe({
                next: profile => {
                  if (this.flagProfile()?.id == profile.id) {
                    this.appData.setProfile(profile);
                  }
                  this.saved.emit(profile);
                }
              });
            }
          } else {
            this.toaster.warning(
              response,
              "Advertencia"
            );
          }
        }
      });
  }


  cancelEdit(): void {
    this.cancel.emit();
  }
}