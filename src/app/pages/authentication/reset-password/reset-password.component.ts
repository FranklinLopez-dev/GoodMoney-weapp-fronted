import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { AbstractControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ResetPasswordRequest } from 'src/app/core/models';
import { LoadingSplashComponent } from 'src/app/shared/components/loading-splash/loading-splash.component';
import { PasswordValidators } from 'src/app/shared/validators/password.validators';
import { AuthGuiaAsideComponent } from '../aside/auth-guia-aside.component';

@Component({
    standalone: true,
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MaterialModule,
        LoadingSplashComponent,
        AuthGuiaAsideComponent
    ]
})
export class ResetPasswordComponent {

    readonly isLoading = signal(false);
    readonly hidePassword = signal(true);
    readonly hidePasswordConfirm = signal(true);
    readonly email = signal<string>('');
    readonly token = signal<string>('');

    form = this.fb.group({
        newPassword: ['', [Validators.required, PasswordValidators.politica(), Validators.maxLength(64)]],
        newPasswordConfirmed: ['', Validators.required]
    },
        {
            validators: PasswordValidators.mustMatch("newPassword", "newPasswordConfirmed"),
        }
    );

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe((params) => {
            const emailParam = params.get('email');
            const tokenParam = params.get('token');

            if (emailParam) {
                this.email.set(emailParam);
            }
            if (tokenParam) {
                this.token.set(tokenParam.replaceAll(' ', '+'));
            }

            // Ya en las signals: se quita el token de la barra y del historial sin recargar ni renavegar.
            if (emailParam || tokenParam) {
                this.limpiarUrl();
            }
        });
    }

    private limpiarUrl(): void {
        const path = this.location.path();
        const sinQuery = path.split('?')[0];
        if (path !== sinQuery) {
            this.location.replaceState(sinQuery);
        }
    }

    /** Traduce el error de política a "Falta una letra y un número." */
    faltas(control: AbstractControl): string {
        return PasswordValidators.describirFaltas(control.errors?.['politica']);
    }

    submit(): void {
        if (this.form.invalid) {
            return;
        }

        this.isLoading.set(true);
        this.form.disable();

        const payload: ResetPasswordRequest = {
            email: this.email(),
            token: this.token(),
            newPassword: this.form.value.newPassword!,
            newPasswordConfirmed: this.form.value.newPasswordConfirmed!
        }

        this.authService.resetPassword(payload)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                    this.form.enable();
                })
            ).subscribe({
                next: (rs: any) => {
                    this.router.navigate(['/home']);
                }
            });
    }

}
