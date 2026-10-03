import { Component, DestroyRef, inject, Input, OnDestroy, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthService } from 'src/app/core/auth/auth.service';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';

/** El correo se confirma ANTES de crear la cuenta, o se verificaría una dirección y se registraría con otra. */
@Component({
  selector: 'register-step-email-verification',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, TrimDirective],
  template: `
  <div class="auth-section">
    <h2 class="auth-section__title">Correo electrónico</h2>
    <p class="auth-section__hint">{{ hint }}</p>
  </div>

  <div [formGroup]="group">

    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Correo electrónico</mat-label>
      <mat-icon matPrefix><i-tabler name="mail"></i-tabler></mat-icon>

      <input
        matInput
        formControlName="email"
        type="email"
        autocomplete="email"
        maxlength="100"
        appTrim="all"
        (input)="alCambiarCorreo()" />

      @if (verificado()) {
        <mat-icon matSuffix class="auth-verificado__icono">check_circle</mat-icon>
      }

      @if (email?.touched && email?.invalid) {
        <mat-hint class="su-error">
          @if (email?.errors?.['required']) { Correo electrónico es obligatorio }
          @if (email?.errors?.['pattern']) { Correo electrónico inválido }
        </mat-hint>
      }
    </mat-form-field>

    @if (verificado()) {

      <p class="auth-verificado">
        <i-tabler name="circle-check"></i-tabler>
        Correo verificado. Puedes continuar.
      </p>

    } @else {

      <div class="auth-codigo__envio">
        <button
          type="button"
          mat-flat-button
          class="gm-btn gm-btn--accent"
          [disabled]="!!email?.invalid || enviando() || espera() > 0"
          (click)="enviarCodigo()">
          {{ enviado() ? 'Reenviar código' : 'Enviar código' }}
          @if (espera() > 0) { ({{ espera() }}s) }
        </button>
      </div>

      @if (enviado()) {
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Código de verificación</mat-label>
          <mat-icon matPrefix><i-tabler name="shield-lock"></i-tabler></mat-icon>

          <input
            matInput
            formControlName="verificationCode"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            (input)="alCambiarCodigo()" />

          <mat-hint>Ingresa el código enviado a {{ email?.value }}.</mat-hint>
        </mat-form-field>
      }

    }

    @if (mensaje()) {
      <p class="su-error">{{ mensaje() }}</p>
    }

  </div>
  `
})
export class StepEmailVerificationComponent implements OnDestroy {

  @Input({ required: true }) group!: FormGroup;

  /** El registro de empresa aclara que el correo puede ser corporativo o personal. */
  @Input() hint = 'Te enviaremos un código de 6 dígitos para confirmar que este correo es tuyo.';

  private authService = inject(AuthService);

  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly espera = signal(0);
  readonly mensaje = signal<string | null>(null);

  private cuentaAtras?: ReturnType<typeof setInterval>;

  get email() { return this.group.get('email'); }
  get codigo() { return this.group.get('verificationCode'); }

  verificado(): boolean {
    return this.group.get('emailVerified')?.value === true;
  }

  enviarCodigo(): void {
    if (this.email?.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.enviando.set(true);
    this.mensaje.set(null);

    this.authService.sendVerificationCode(this.email!.value).subscribe({
      next: res => {
        this.enviando.set(false);

        if (!res?.success) {
          this.mensaje.set(res?.error ?? 'No pudimos enviar el código. Inténtalo de nuevo.');
          return;
        }

        this.enviado.set(true);
        this.iniciarEspera(60);
      },
      error: () => {
        this.enviando.set(false);
        this.mensaje.set('No pudimos enviar el código. Revisa tu conexión e inténtalo de nuevo.');
      }
    });
  }

  /** Se comprueba solo al completar los 6 dígitos: sin botón de por medio. */
  alCambiarCodigo(): void {
    const valor = (this.codigo?.value ?? '').toString().replace(/\D/g, '').slice(0, 6);

    if (valor !== this.codigo?.value) {
      this.codigo?.setValue(valor, { emitEvent: false });
    }

    this.mensaje.set(null);

    if (valor.length < 6) return;

    this.authService.verifyCode(this.email!.value, valor).subscribe({
      next: res => {
        if (res?.success) {
          this.group.get('emailVerified')?.setValue(true);
          this.mensaje.set(null);
        } else {
          this.group.get('emailVerified')?.setValue(false);
          this.mensaje.set(res?.error ?? 'El código no es válido.');
        }
      },
      error: () => this.mensaje.set('No pudimos comprobar el código. Inténtalo de nuevo.')
    });
  }

  /** Cambiar el correo invalida lo verificado hasta ese momento. */
  alCambiarCorreo(): void {
    if (this.verificado() || this.enviado()) {
      this.group.get('emailVerified')?.setValue(false);
      this.codigo?.setValue(null);
      this.enviado.set(false);
      this.mensaje.set(null);
    }
  }

  private iniciarEspera(segundos: number): void {
    clearInterval(this.cuentaAtras);
    this.espera.set(segundos);

    this.cuentaAtras = setInterval(() => {
      const quedan = this.espera() - 1;
      this.espera.set(quedan);
      if (quedan <= 0) clearInterval(this.cuentaAtras);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.cuentaAtras);
  }
}
