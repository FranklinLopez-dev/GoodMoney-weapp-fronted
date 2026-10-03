import { Component, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { ChangePasswordRequest } from 'src/app/core/models';
import { LoadingSplashComponent } from 'src/app/shared/components/loading-splash/loading-splash.component';
import { PasswordValidators } from 'src/app/shared/validators/password.validators';
import { TablerIconsModule } from 'angular-tabler-icons';

/** Cambio obligatorio: mientras el token traiga MustChangePassword el backend responde 403 a todo lo demas. */
@Component({
    standalone: true,
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MaterialModule,
        LoadingSplashComponent,
        TablerIconsModule
    ]
})
export class ChangePasswordComponent {

    readonly isLoading = signal(false);
    readonly hideCurrent = signal(true);
    readonly hidePassword = signal(true);
    readonly hidePasswordConfirm = signal(true);
    readonly errorMessage = signal<string>('');

    form = this.fb.group({
        currentPassword: ['', [Validators.required, Validators.maxLength(64)]],
        newPassword: ['', [Validators.required, PasswordValidators.politica(), Validators.maxLength(64)]],
        newPasswordConfirmed: ['', Validators.required]
    },
        {
            validators: PasswordValidators.mustMatch('newPassword', 'newPasswordConfirmed'),
        }
    );

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private authStore: AuthStore,
        private router: Router
    ) { }

    /** Traduce el error de política a "Falta una letra y un número." */
    faltas(control: AbstractControl): string {
        return PasswordValidators.describirFaltas(control.errors?.['politica']);
    }

    submit(): void {
        if (this.form.invalid) {
            return;
        }

        this.errorMessage.set('');
        this.isLoading.set(true);
        this.form.disable();

        const payload: ChangePasswordRequest = {
            currentPassword: this.form.value.currentPassword!,
            newPassword: this.form.value.newPassword!,
            newPasswordConfirmed: this.form.value.newPasswordConfirmed!
        };

        this.authService.changePassword(payload)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                    this.form.enable();
                })
            ).subscribe({
                next: () => {
                    // changePassword ya guardo el token nuevo, que viene sin el flag
                    this.router.navigate(['/home']);
                },
                error: (err) => {
                    this.errorMessage.set(
                        typeof err?.error === 'string'
                            ? err.error
                            : 'No se pudo cambiar la contraseña. Inténtalo nuevamente.'
                    );
                }
            });
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/authentication/login']);
    }
}
