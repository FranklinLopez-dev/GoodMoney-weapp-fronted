import { Component, Input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'register-step-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule
  ],
  template: `
  <div [formGroup]="group">
    <div class="auth-section">
      <h2 class="auth-section__title">Crea tu contraseña</h2>
      <p class="auth-section__hint">En Good Money cuidamos tu seguridad. Crea una contraseña con mínimo 6 dígitos.</p>
    </div>

    <mat-form-field appearance="outline" class="w-100">
        <mat-label>Tu contraseña</mat-label>
        <mat-icon matPrefix>
          <i-tabler name="lock" class="icon-20 d-flex"></i-tabler>
        </mat-icon>

        <input
          matInput
          formControlName="password"
          autocomplete="off"
          [type]="hidePassword() ? 'password' : 'text'"
        />

        <button
          mat-icon-button
          matSuffix
          type="button"
          (click)="hidePassword.set(!hidePassword())"
        >
          <mat-icon class="op-5">
            {{ hidePassword() ? 'visibility_off' : 'visibility' }}
          </mat-icon>
        </button>

        @if (control['password'].touched && control['password'].invalid) {
          <mat-hint class="su-error">
            @if (control['password'].errors?.['required']) {
              Contraseña es obligatoria
            }
            @if (control['password'].errors?.['minlength']) {
              Mínimo 6 caracteres
            }
          </mat-hint>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Confirmar contraseña</mat-label>
        <mat-icon matPrefix>
          <i-tabler name="lock" class="icon-20 d-flex"></i-tabler>
        </mat-icon>

        <input
          matInput
          formControlName="passwordConfirm"
          autocomplete="off"
          [type]="hidePasswordConfirm() ? 'password' : 'text'"
        />

        <button
          mat-icon-button
          matSuffix
          type="button"
          (click)="hidePasswordConfirm.set(!hidePasswordConfirm())"
        >
          <mat-icon class="op-5">
            {{ hidePasswordConfirm() ? 'visibility_off' : 'visibility' }}
          </mat-icon>
        </button>

        @if (control['passwordConfirm'].touched && control['passwordConfirm'].invalid) {
          <mat-hint class="su-error">
            @if (control['passwordConfirm'].errors?.['required']) {
              Confirmación obligatoria
            }
            @if (control['passwordConfirm'].errors?.['mustMatch']) {
              Las contraseñas deben coincidir
            }
          </mat-hint>
        }
      </mat-form-field>
  </div>
  `
})
export class StepPasswordComponent {

  @Input({ required: true }) group!: FormGroup;

  readonly hidePassword = signal(true);
  readonly hidePasswordConfirm = signal(true);

  get control() {
    return this.group.controls;
  }

}
