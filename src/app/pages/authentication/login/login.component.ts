import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthRequest } from 'src/app/core/models';
import { LoadingSplashService } from 'src/app/shared/services/loading-splash.service';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';
import { AuthAsideComponent } from '../aside/auth-aside.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MaterialModule,
    TrimDirective,
    AuthAsideComponent
  ]
})
export class LoginComponent implements OnInit {

  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);

  /** La cuenta pide verificacion en dos pasos: falta el codigo del correo. */
  readonly esperandoCodigo = signal(false);
  readonly codigo = signal('');
  readonly errorCodigo = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]],
    rememberMe: [false]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingSplash: LoadingSplashService
  ) { }

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.form.disable();
    this.mostrarCargaLogin();

    this.authService.login(this.form.value as AuthRequest)
      .subscribe({
        next: (res) => {
          // Con dos pasos activo no llega token todavia: se pide el codigo.
          if (res?.requiresTwoFactor) {
            this.detenerCarga();
            this.esperandoCodigo.set(true);
            return;
          }

          if (this.form.value.rememberMe) {
            localStorage.setItem('rememberedEmail', this.form.value.email!);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          this.router.navigate(['/operations/create'])
            .catch(() => this.detenerCarga());
        },
        error: () => this.detenerCarga()
      });
  }

  /** El campo solo admite digitos aunque el teclado escriba otra cosa. */
  escribirCodigo(target: EventTarget | null): void {
    const input = target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = limpio;
    this.codigo.set(limpio);
  }

  /** Completa el ingreso con el codigo de 6 digitos que llego al correo. */
  confirmarCodigo(): void {
    const code = this.codigo().replace(/\D/g, '').slice(0, 6);
    if (code.length < 6 || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorCodigo.set(null);
    this.mostrarCargaLogin();

    this.authService.loginTwoFactor(this.form.value.email!, this.form.value.password!, code)
      .subscribe({
        next: () => {
          this.router.navigate(['/operations/create'])
            .catch(() => this.detenerCarga(false));
        },
        error: err => {
          this.detenerCarga(false);
          this.errorCodigo.set(
            typeof err?.error === 'string' ? err.error : 'El codigo no es valido.'
          );
        }
      });
  }

  volverAlLogin(): void {
    this.esperandoCodigo.set(false);
    this.codigo.set('');
    this.errorCodigo.set(null);
  }

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  private detenerCarga(enableForm = true): void {
    this.isLoading.set(false);
    this.loadingSplash.hide();
    if (enableForm) {
      this.form.enable();
    }
  }

  private mostrarCargaLogin(): void {
    this.loadingSplash.show({
      title: 'Iniciando sesión',
      subtitle: 'Estamos ingresando a tu cuenta de Good Money',
      showTips: true
    });
  }
}
