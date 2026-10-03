import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NaturalPepSectionComponent } from 'src/app/pages/profiles/pages/details/components/profile-form/sections/natural/natural-pep/natural-pep.section';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { finalize } from 'rxjs';
import { Profile } from 'src/app/core/models';
import { OperationCreateStore } from '../../../store/operation-create.store';
import { ToastrService } from 'ngx-toastr';
import { RequisitoSbs } from '../../../../operations.service';

/** Parentescos del formulario PEP (códigos del perfil) en texto, para la declaración. */
const PARENTESCOS: Record<string, string> = {
  '1': 'PADRE', '2': 'MADRE', '3': 'HIJO/A', '4': 'ABUELO/A', '5': 'NIETO/A', '6': 'HERMANO/A',
  '7': 'CÓNYUGE / CONVIVIENTE', '8': 'SUEGRO/A', '9': 'YERNO', '10': 'CUÑADO/A', '11': 'ABUELO/A DE CÓNYUGE', '12': 'NIETO/A DE CÓNYUGE',
};

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    NaturalPepSectionComponent
  ],
  templateUrl: './sbs-info-dialog.component.html'
})
export class SbsInfoDialogComponent {

  readonly store = inject(OperationCreateStore);
  private fb = inject(FormBuilder);
  private profilesService = inject(ProfilesService);
  private dialogRef = inject(MatDialogRef<SbsInfoDialogComponent>);
  private appData = inject(UtilsService);
  /** Por qué se pide (monto o acumulado del mes): se le explica al cliente. */
  private readonly datos = inject(MAT_DIALOG_DATA, { optional: true });
  readonly requisito: RequisitoSbs | null = this.datos?.requisito ?? null;
  /** Solo renovar la declaración PEP (vencida): sin las preguntas de la declaración jurada. */
  readonly soloPep: boolean = this.datos?.soloPep === true;

  profile = this.appData.profile();
  loadingProfile = signal(false);
  saving = signal(false);
  private cacheProfile!: Profile;

  form: FormGroup = this.fb.group({
    origenFondos: [null, Validators.required],
    statusCivil: [null, Validators.required],
    isPep: [false],
    institution: [null],
    cargo: [null],
    parientesPep: this.fb.array([]),
    isFamiliarPep: [false],
    parientesFamiliarPep: this.fb.array([]),
    // Lo que pide el formato SBS de declaración jurada además de la ficha PEP.
    origenFondosOtros: [null],
    proposito: ['Compra y venta de moneda extranjera', Validators.required],
    conyuge: [null],
    pepHistorico: [null],
    pepColaborador: [null],
    acepta: [false, Validators.requiredTrue],
  });

  /**
   * Dijo que HA SIDO PEP o colaborador directo sin serlo hoy: la sección del perfil solo muestra cargo e
   * institución con el interruptor "es PEP", así que aquí se muestran aparte.
   */
  get pideCargoFueraDelToggle(): boolean {
    const v = this.form.value;
    return !v.isPep && (v.pepHistorico === true || v.pepColaborador === 'SI_SOY' || v.pepColaborador === 'SI_HE_SIDO');
  }

  /** "Otros" en el origen exige el detalle. */
  get pideDetalleOrigen(): boolean {
    return (this.form.value.origenFondos ?? '').startsWith('099');
  }

  constructor(private toaster: ToastrService) {
    if (this.soloPep) {
      // Sin origen de fondos ni propósito: eso es de la declaración jurada, no de la PEP.
      this.form.removeControl('origenFondos');
      this.form.removeControl('proposito');
    }
    this.prefil();
  }

  private prefil(): void {
    const p = this.profile;
    if (!p) return;

    const cached = this.store.legalRep();
    if (cached) {
      this.fillFromProfile(cached);
      this.takeSnapshot(cached);
      return;
    }

    if (p.documentTypeIsNatural) {
      this.fillFromProfile(p);
      this.takeSnapshot(p);
      return;
    }

    this.loadingProfile.set(true);

    this.profilesService.getAdmin()
      .pipe(
        finalize(() => {
          this.loadingProfile.set(false)
        })
      )
      .subscribe({
        next: rep => {
          if (rep) {
            this.store.setLegalRep(rep);
            this.fillFromProfile(rep);
            this.takeSnapshot(rep);
          }
        }
      });
  }

  private takeSnapshot(profile: Profile): void {
    this.cacheProfile = profile;
  }

  private fillFromProfile(profile: any): void {
    const profileForPatch: any = { ...profile };

    if (typeof profileForPatch.parientesPep === 'string') {
      profileForPatch.parientesPep =
        this.parseParientesString(profileForPatch.parientesPep);
    }

    if (typeof profileForPatch.parientesFamiliarPep === 'string') {
      profileForPatch.parientesFamiliarPep =
        this.parseParientesString(profileForPatch.parientesFamiliarPep);
    }

    this.form.patchValue(profileForPatch);

    const pepArray = this.form.get('parientesPep') as FormArray;
    pepArray.clear();
    (profileForPatch.parientesPep ?? []).forEach((p: any) => {
      pepArray.push(
        this.fb.group({
          names: [p.names ?? '', Validators.required],
          relationship: [p.relationship ?? '', Validators.required]
        })
      );
    });

    const famArray = this.form.get('parientesFamiliarPep') as FormArray;
    famArray.clear();
    (profileForPatch.parientesFamiliarPep ?? []).forEach((p: any) => {
      famArray.push(
        this.fb.group({
          names: [p.names ?? '', Validators.required],
          relationship: [p.relationship ?? '', Validators.required]
        })
      );
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.pideDetalleOrigen && !this.form.value.origenFondosOtros?.trim()) {
      this.toaster.warning('Detalla el origen de los fondos (elegiste «Otros»).', 'Declaración jurada');
      return;
    }
    const v = this.form.getRawValue();
    const declaraPep = v.isPep || v.pepHistorico === true || v.pepColaborador === 'SI_SOY' || v.pepColaborador === 'SI_HE_SIDO';
    if (declaraPep && (!v.cargo?.trim() || !v.institution?.trim())) {
      this.toaster.warning('Si eres o has sido PEP, indica el cargo y la institución.', 'Declaración jurada');
      return;
    }
    const parientes = (lista: any[]) => (lista ?? [])
      .filter(p => p?.names?.trim())
      .map(p => ({ nombres: p.names.trim(), parentesco: PARENTESCOS[p.relationship] ?? p.relationship ?? '' }));

    if (this.soloPep) {
      const renovacion = { declaracionPep: { esPep: !!v.isPep, esFamiliarPep: !!v.isFamiliarPep, acepta: v.acepta === true } };
      this.guardarPerfilYCerrar(renovacion);
      return;
    }

    // La declaración jurada SBS: las respuestas del formato y la aceptación (vale como firma).
    const request = {
      origenFondos: v.origenFondos,
      declaracionSbs: {
        origenFondos: v.origenFondos,
        origenFondosOtros: this.pideDetalleOrigen ? v.origenFondosOtros?.trim() : null,
        proposito: v.proposito,
        estadoCivil: v.statusCivil,
        conyuge: v.conyuge?.trim() || null,
        esPep: !!v.isPep,
        pepHistorico: v.pepHistorico,
        pepColaborador: v.pepColaborador,
        pepCargo: declaraPep ? v.cargo : null,
        pepInstitucion: declaraPep ? v.institution : null,
        parientesPep: declaraPep ? parientes(v.parientesPep) : [],
        esFamiliarPep: !!v.isFamiliarPep,
        familiaresPep: v.isFamiliarPep ? parientes(v.parientesFamiliarPep) : [],
        acepta: v.acepta === true,
      },
    };

    this.guardarPerfilYCerrar(request);
  }

  /** Actualiza la ficha PEP del perfil si cambió y devuelve la declaración al paso de cuentas. */
  private guardarPerfilYCerrar(request: any): void {
    const payload: any = JSON.parse(JSON.stringify(this.cacheProfile));
    payload.statusCivil = this.form.value.statusCivil;
    payload.isPep = this.form.value.isPep;
    payload.isFamiliarPep = this.form.value.isFamiliarPep;
    payload.cargo = this.form.value.cargo;
    payload.institution = this.form.value.institution;
    if (this.form.contains('origenFondos')) payload.origenFondos = this.form.value.origenFondos;

    const pepArray: any[] = this.form.get('parientesPep')?.value ?? [];
    const familiarArray: any[] = this.form.get('parientesFamiliarPep')?.value ?? [];

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

    if (this.hasSbsChanges(payload)) {
      this.store.setLegalRep(payload);
      this.dialogRef.close(request);
      return;
    }

    this.saving.set(true);

    this.profilesService.updateNatural(payload)
      .pipe(
        finalize(() => {
          this.saving.set(false)
        })
      )
      .subscribe({
        next: response => {
          if (response == 'OK') {
            this.toaster.success(
              "Perfil editado corectamente.",
              "Éxito"
            );
            this.store.setLegalRep(payload);
            this.dialogRef.close(request);
          } else {
            this.toaster.warning(
              response,
              "Advertencia"
            );
          }
        }
      });
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

  private hasSbsChanges(payload: Profile): boolean {
    return (this.cacheProfile?.statusCivil == payload?.statusCivil
      && this.cacheProfile?.isPep == payload?.isPep
      && this.cacheProfile?.isFamiliarPep == payload?.isFamiliarPep
      && this.cacheProfile?.cargo == payload?.cargo
      && this.cacheProfile?.institution == payload?.institution
      && this.cacheProfile?.parientesPep == payload?.parientesPep
      && this.cacheProfile?.parientesFamiliarPep == payload?.parientesFamiliarPep)
  }

}
