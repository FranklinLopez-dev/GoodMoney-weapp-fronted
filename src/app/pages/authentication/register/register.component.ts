import { Component, inject, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, Observable, of, switchMap } from 'rxjs';

import { RegisterStore } from './register.store';
import { buildNaturalForm } from './forms/natural.form';
import { buildJuridicoForm } from './forms/juridico.form';
import { AuthRequest, DocumentRequest } from 'src/app/core/models/security/auth.model';
import { AuthService } from 'src/app/core/auth/auth.service';

import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router, RouterModule } from '@angular/router';

import { StepPasswordComponent } from './steps/step-password.component';
import { NaturalStep3DocumentComponent } from './steps/natural/step3-document.component';
import { NaturalStep4FilesComponent } from './steps/natural/step4-files.component';
import { StepAddressComponent } from './steps/step-address.component';
import { StepPositionComponent } from './steps/step-position.component';
import { StepPepComponent } from './steps/step-pep.component';
import { StepPhoneComponent } from './steps/step-phone.component';
import { StepConfirmacionComponent } from './steps/step-confirmacion.component';
import { LoadingSplashComponent } from 'src/app/shared/components/loading-splash/loading-splash.component';
import { JuridicoStep1RucComponent } from './steps/juridico/step1-ruc.component';
import { StepEmailVerificationComponent } from './steps/step-email-verification.component';
import { JuridicoStep5ActivityComponent } from './steps/juridico/step5-activity.component';
import { JuridicoStep6RepresentativeComponent } from './steps/juridico/step6-representative.component';
import { JuridicoStep8FilesComponent } from './steps/juridico/step8-files.component';
import { JuridicoStep9AddressComponent } from './steps/juridico/step9-address.component';
import { JuridicoStep7EjecutanteComponent } from './steps/juridico/step7-beneficiario.component';
import { AuthAsideComponent } from '../aside/auth-aside.component';
import { AuthGuiaAsideComponent } from '../aside/auth-guia-aside.component';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    TablerIconsModule,
    StepEmailVerificationComponent,
    StepPasswordComponent,
    NaturalStep3DocumentComponent,
    NaturalStep4FilesComponent,
    StepAddressComponent,
    StepPositionComponent,
    StepPepComponent,
    StepPhoneComponent,
    StepConfirmacionComponent,
    LoadingSplashComponent,
    JuridicoStep1RucComponent,
    JuridicoStep5ActivityComponent,
    JuridicoStep6RepresentativeComponent,
    JuridicoStep7EjecutanteComponent,
    JuridicoStep8FilesComponent,
    JuridicoStep9AddressComponent,
    AuthAsideComponent,
    AuthGuiaAsideComponent
  ],
  providers: [RegisterStore]
})
export class RegisterComponent implements OnDestroy {

  private fb = inject(FormBuilder);
  store = inject(RegisterStore);
  authService = inject(AuthService);

  naturalForm = buildNaturalForm(this.fb);
  juridicoForm = buildJuridicoForm(this.fb);

  status = this.store.status;
  etapaIndex = this.store.stepIndex;
  isLoading = this.store.isLoading;

  etapas = computed(() =>
    this.status() === 'natural'
      ? this.store.naturalEtapas
      : this.store.juridicoEtapas
  );

  etapaActual = computed(() => this.etapas()[this.etapaIndex()]);

  /** "Paso 1 de 3", tal cual el chip del aside en el diseño (frame 425). */
  pasoChip = computed(() =>
    `Paso ${this.etapaIndex() + 1} de ${this.etapas().length}`
  );

  /** La burbuja del monito explica qué se hace en el paso actual. */
  asideHint = computed(() => {
    const natural = this.status() === 'natural';

    switch (this.etapaIndex()) {
      case 0:
        return 'Registra tu correo, contraseña y teléfono para crear tu cuenta.';
      case 1:
        return natural
          ? 'Registra tus datos personales para la validación correspondiente.'
          : 'Registra los datos de tu empresa para la validación correspondiente.';
      default:
        return 'Confirma tus datos y termina el proceso de registro.';
    }
  });

  esUltimaEtapa = computed(() => this.etapaIndex() === this.etapas().length - 1);

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) { }

  selectNatural() {
    this.store.selectProfile('natural');
  }

  selectJuridico() {
    this.store.selectProfile('juridico');
  }

  // Acceso a los grupos

  private get currentForm(): FormGroup {
    return this.status() === 'juridico' ? this.juridicoForm : this.naturalForm;
  }

  /** El FormGroup de un paso concreto (`step1`, `step2`, …). */
  public grupo(nombre: string): FormGroup {
    return this.currentForm.get(nombre) as FormGroup;
  }

  public getStepGroupRep(): FormGroup {
    return this.currentForm.get('step6') as FormGroup;
  }

  /** El representante legal declara ser tambien el beneficiario final. */
  esRepresentanteBeneficiario(): boolean {
    return this.status() === 'juridico' && !!this.getStepGroupRep()?.value?.isMe;
  }

  /** Metodo y no `computed`: depende de `isMe`, un FormControl, y se quedaria cacheado con el primer valor. */
  gruposVisibles(): string[] {
    const grupos = this.etapaActual()?.grupos ?? [];

    if (this.status() === 'juridico' && this.esRepresentanteBeneficiario()) {
      return grupos.filter(g => g !== 'step7');
    }

    return grupos;
  }

  muestra(grupo: string): boolean {
    return this.gruposVisibles().includes(grupo);
  }

  etapaValida(): boolean {
    return this.gruposVisibles().every(g => this.grupo(g)?.valid);
  }

  // Navegacion

  goNext(): void {
    if (!this.etapaValida()) {
      this.gruposVisibles().forEach(g => this.grupo(g)?.markAllAsTouched());
      return;
    }

    this.validacionesDeSalida().subscribe(ok => {
      if (ok) this.store.nextStep(this.etapas().length);
    });
  }

  /** Desde la primera etapa vuelve a la elección de tipo de cuenta: antes no había forma de corregirse. */
  goPrev(): void {
    if (this.etapaIndex() === 0) {
      this.volverAlPerfil();
      return;
    }

    this.store.prevStep();
  }

  /** Siempre se puede retroceder: en la etapa 1 se sale a elegir perfil. */
  canGoPrev = computed(() => true);

  /** Los dos formularios no comparten estructura: mezclarlos deja datos del perfil anterior en el payload. */
  volverAlPerfil(): void {
    this.naturalForm.reset();
    this.juridicoForm.reset();
    this.naturalForm = buildNaturalForm(this.fb);
    this.juridicoForm = buildJuridicoForm(this.fb);
    this.store.reset();
  }

  /** Comprueba contra el API que el correo y los documentos no estén ya registrados. */
  private validacionesDeSalida(): Observable<boolean> {
    const natural = this.status() === 'natural';
    const etapa = this.etapaIndex();

    if (natural && etapa === 0) {
      return this.emailLibre(this.naturalForm.get('step1.email')?.value,
        'Ya tienes una cuenta con este correo, intenta iniciar sesión. Cualquier duda contáctese con nosotros.');
    }

    // El documento va en la etapa 2 ("Datos Personales"), que es la 1 contando desde cero.
    if (natural && etapa === 1) {
      return this.documentoLibre({
        documentTypeId: this.naturalForm.get('step3.documentTypeId')?.value,
        documentNumber: this.naturalForm.get('step3.documentNumber')?.value
      }, 'Ya tienes una cuenta con este documento, intenta iniciar sesión.');
    }

    if (!natural && etapa === 0) {
      return this.emailLibre(this.juridicoForm.get('step2.email')?.value,
        'Ya tienes una cuenta asociada a este correo, intenta iniciar sesión.');
    }

    if (!natural && etapa === 1) {
      // Aqui conviven el RUC de la empresa y el documento de la persona: primero la empresa y, si pasa, la persona.
      const esRep = this.esRepresentanteBeneficiario();

      return this.documentoLibre({
        documentTypeId: this.juridicoForm.get('step1.documentTypeId')?.value,
        documentNumber: this.juridicoForm.get('step1.documentNumber')?.value
      }, 'Ya tienes una cuenta asociada a este documento, intenta iniciar sesión. Cualquier duda contáctese con nosotros.')
        .pipe(switchMap(ok => ok
          ? this.documentoLibre({
            documentTypeId: this.juridicoForm.get(esRep ? 'step6.documentTypeRepId' : 'step7.documentTypeBenefId')?.value,
            documentNumber: this.juridicoForm.get(esRep ? 'step6.documentNumberRep' : 'step7.documentNumberBenef')?.value
          }, 'Ya tienes una cuenta asociada a este documento, intenta iniciar sesión y asociar la empresa desde tu cuenta personal. Cualquier duda contáctese con nosotros.')
          : of(false)));
    }

    return of(true);
  }

  private emailLibre(email: string, mensaje: string): Observable<boolean> {
    const account: AuthRequest = { email, password: '123456' };

    return new Observable<boolean>(observer => {
      this.authService.validarEmail(account).subscribe(existe => {
        if (existe) this.toastr.warning(mensaje, 'Advertencia!');
        observer.next(!existe);
        observer.complete();
      });
    });
  }

  private documentoLibre(document: DocumentRequest, mensaje: string): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.authService.validarDocumento(document).subscribe(existe => {
        if (existe) this.toastr.warning(mensaje, 'Advertencia!');
        observer.next(!existe);
        observer.complete();
      });
    });
  }

  // Envio

  submitNatural() {
    if (this.naturalForm.invalid) {
      this.naturalForm.markAllAsTouched();
      return;
    }

    this.store.setLoading(true);

    const payload = {
      ...this.naturalForm.value.step1,
      ...this.naturalForm.value.step2,
      ...this.naturalForm.value.step3,
      ...this.naturalForm.value.step4,
      ...this.naturalForm.value.step5,
      ...this.naturalForm.value.step6,
      ...this.naturalForm.value.step7,
      ...this.naturalForm.value.step8,
      ...this.naturalForm.value.step9,
      lastNames: this.naturalForm.value.step3.lastNamePaterno + ' ' + this.naturalForm.value.step3.lastNameMaterno
    }

    this.naturalForm.disable();

    this.authService.registerNatural(payload)
      .pipe(
        finalize(() => {
          this.naturalForm.enable();
          this.store.setLoading(false);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success) {
            this.authService.setEmailSignUp(payload.email);
            this.router.navigate(["/authentication/account-created"]);
          } else {
            this.toastr.warning(response?.error, "Advertencia!");
          }

        }
      });
  }

  submitJuridico() {
    if (this.juridicoForm.invalid) {
      this.juridicoForm.markAllAsTouched();
      return;
    }

    this.store.setLoading(true);

    const payload = {
      ...this.juridicoForm.value.step1,
      ...this.juridicoForm.value.step2,
      ...this.juridicoForm.value.step3,
      ...this.juridicoForm.value.step4,
      ...this.juridicoForm.value.step5,
      ...this.juridicoForm.value.step6,
      ...this.juridicoForm.value.step7,
      ...this.juridicoForm.value.step8,
      ...this.juridicoForm.value.step9,
      ...this.juridicoForm.value.step10,
      ...this.juridicoForm.value.step11,
      ...this.juridicoForm.value.step12,
      ...this.juridicoForm.value.step13,
      lastNamesRep: this.juridicoForm.value.step6.lastNamePaternoRep + ' ' + this.juridicoForm.value.step6.lastNameMaternoRep,
      documentTypeBenefId: this.juridicoForm.value.step6.isMe ? this.juridicoForm.value.step6.documentTypeRepId : this.juridicoForm.value.step7.documentTypeBenefId,
      documentNumberBenef: this.juridicoForm.value.step6.isMe ? this.juridicoForm.value.step6.documentNumberRep : this.juridicoForm.value.step7.documentNumberBenef,
      namesBenef: this.juridicoForm.value.step6.isMe ? this.juridicoForm.value.step6.namesRep : this.juridicoForm.value.step7.namesBenef,
      lastNamePaternoBenef: this.juridicoForm.value.step6.isMe ? this.juridicoForm.value.step6.lastNamePaternoRep : this.juridicoForm.value.step7.lastNamePaternoBenef,
      lastNameMaternoBenef: this.juridicoForm.value.step6.isMe ? this.juridicoForm.value.step6.lastNameMaternoRep : this.juridicoForm.value.step7.lastNameMaternoBenef,
      lastNamesBenef: this.juridicoForm.value.step6.isMe ? (this.juridicoForm.value.step6.lastNamePaternoRep + ' ' + this.juridicoForm.value.step6.lastNameMaternoRep) : (this.juridicoForm.value.step7.lastNamePaternoBenef + ' ' + this.juridicoForm.value.step7.lastNameMaternoBenef)
    }

    this.juridicoForm.disable();

    this.authService.registerJuridico(payload)
      .pipe(
        finalize(() => {
          this.juridicoForm.enable();
          this.store.setLoading(false);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success) {
            this.authService.setEmailSignUp(payload.email);
            this.router.navigate(["/authentication/account-created"]);
          } else {
            this.toastr.warning(response?.error, "Advertencia!");
          }

        }
      });
  }

  ngOnDestroy(): void {
    this.store.reset();
  }
}
