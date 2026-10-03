import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ForgotPasswordRequest } from 'src/app/core/models';
import { LoadingSplashComponent } from 'src/app/shared/components/loading-splash/loading-splash.component';
import { RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings } from 'ng-recaptcha';
import { environment } from 'src/environments/environment';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';
import { AuthGuiaAsideComponent } from '../aside/auth-guia-aside.component';

@Component({
    standalone: true,
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    providers: [
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: { siteKey: environment.recaptcha.siteKey } as RecaptchaSettings,
        },
    ],
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MaterialModule,
        LoadingSplashComponent,
        RecaptchaModule,
        RecaptchaFormsModule,
        TrimDirective,
        AuthGuiaAsideComponent
    ]
})
export class ForgotPasswordComponent {

    readonly isLoading = signal(false);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        reCaptchaToken: new FormControl(null, Validators.required)
    });

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private toastr: ToastrService
    ) { }

    submit(): void {
        if (this.form.invalid) {
            return;
        }

        this.isLoading.set(true);
        this.form.disable();

        const payload: ForgotPasswordRequest = {
            email: this.form.value.email!,
            reCaptchaToken: this.form.value.reCaptchaToken!
        }

        this.authService.forgotPassword(payload)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                    this.form.enable();
                })
            ).subscribe({
                next: (rs: any) => {
                    if (rs?.success) {
                        this.toastr.success('¡Restablecimiento de contraseña enviado! Recibirás un correo electrónico.', 'Éxito');
                    } else {
                        this.toastr.warning(rs?.error, 'Advertencia');
                    }
                }
            });
    }

}
