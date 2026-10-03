import { Component, computed, inject, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings } from 'ng-recaptcha';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDialog } from '@angular/material/dialog';
import { TermsDialogComponent } from '../terms/terms-dialog.component';
import { environment } from 'src/environments/environment';
import { RegisterStore } from '../register.store';

/** Ya no pide las dos cuentas bancarias: era el punto de mayor abandono y ahora las pide `bankAccountsGuard`. */
@Component({
  selector: 'register-step-confirmacion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    RecaptchaModule,
    RecaptchaFormsModule
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.recaptcha.siteKey } as RecaptchaSettings
    }
  ],
  template: `
  <div class="auth-section">
    <h2 class="auth-section__title">Ya está, revisa y confirma</h2>
    <p class="auth-section__hint">
      Comprueba que los datos son correctos. Podrás cambiarlos después desde tu perfil.
    </p>
  </div>

  <div class="resumen">
    @for (fila of resumen(); track fila.etiqueta) {
      <div class="resumen__fila">
        <span class="resumen__etiqueta">{{ fila.etiqueta }}</span>
        <span class="resumen__valor" [matTooltip]="fila.valor">{{ fila.valor }}</span>
      </div>
    }
  </div>

  <div class="aviso-cuentas">
    <i-tabler name="building-bank"></i-tabler>
    <div>
      <strong>Tus cuentas bancarias, cuando vayas a cambiar.</strong>
      Te pediremos una cuenta en soles y otra en dólares justo antes de tu primera
      operación, para saber dónde depositarte.
    </div>
  </div>

  <div [formGroup]="group">
    <div class="d-flex align-items-center justify-content-center m-t-16">
      <re-captcha formControlName="reCaptchaToken"></re-captcha>
    </div>

    <div class="d-flex align-items-center justify-content-center m-t-16">
      <mat-checkbox formControlName="agreements">
        Acepto los
        <a class="terminos-enlace" (click)="abrirTerminos($event)">términos y condiciones y la política de privacidad</a> *
      </mat-checkbox>
    </div>
  </div>
  `,
  styles: [`
    .terminos-enlace {
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
    }
  `]
})
export class StepConfirmacionComponent {

  @Input({ required: true }) group!: FormGroup;

  private dialog = inject(MatDialog);
  private store = inject(RegisterStore);

  get control() {
    return this.group.controls;
  }

  /** Lee del formulario padre lo que el usuario ya declaró. */
  resumen = computed(() => {
    const raiz = this.group.parent;
    if (!raiz) return [];

    const natural = this.store.status() === 'natural';
    const v = (ruta: string) => raiz.get(ruta)?.value ?? '';

    const filas = natural
      ? [
        ['Correo', v('step1.email')],
        ['Celular', v('step8.cellPhone')],
        ['Documento', `${v('step3.documentNumber')}`],
        ['Nombre', `${v('step3.names')} ${v('step3.lastNamePaterno')} ${v('step3.lastNameMaterno')}`.trim()]
      ]
      : [
        ['Correo', v('step2.email')],
        ['Celular', v('step12.cellPhone')],
        ['RUC', v('step1.documentNumber')],
        ['Razón social', v('step1.names')],
        ['Representante', `${v('step6.namesRep')} ${v('step6.lastNamePaternoRep')}`.trim()]
      ];

    return filas
      .filter(([, valor]) => !!valor)
      .map(([etiqueta, valor]) => ({ etiqueta, valor }));
  });

  /** El enlace abre el diálogo sin marcar la casilla; aceptar dentro sí la marca. */
  abrirTerminos(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const ref = this.dialog.open(TermsDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false
    });

    ref.afterClosed().subscribe(aceptado => {
      if (aceptado) this.control['agreements'].setValue(true);
    });
  }
}
