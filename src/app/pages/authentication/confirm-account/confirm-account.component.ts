import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ConfirmAccountRequest } from 'src/app/core/models';
import { LoadingSplashComponent } from 'src/app/shared/components/loading-splash/loading-splash.component';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
    standalone: true,
    selector: 'app-confirm-account',
    templateUrl: './confirm-account.component.html',
    imports: [
        LoadingSplashComponent,
        TablerIconsModule
    ]
})
export class ConfirmAccountComponent {

    readonly isLoading = signal(false);
    readonly email = signal<string>('');
    readonly token = signal<string>('');

    constructor(
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit(): void {

        this.route.queryParamMap.subscribe(params => {
            this.email.set(params.get('email') ?? '');
            this.token.set(params.get('token') ?? '');

            if (this.email() && this.token()) {
                this.confirmedEmail();
            }

            // El token ya se leyo; se retira de la barra y del historial sin recargar ni renavegar.
            this.limpiarUrl();
        });
    }

    private limpiarUrl(): void {
        const path = this.location.path();
        const sinQuery = path.split('?')[0];
        if (path !== sinQuery) {
            this.location.replaceState(sinQuery);
        }
    }

    confirmedEmail(): void {

        this.isLoading.set(true);

        const payload: ConfirmAccountRequest = {
            email: this.email(),
            token: this.token()
        }

        this.authService.confirmAccount(payload)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                })
            ).subscribe({
                next: (rs: any) => {
                    this.router.navigate(['/home']);
                },
                error: (err: any) => {
                    this.router.navigate(['/authentication/login']);
                }
            });
    }

}
