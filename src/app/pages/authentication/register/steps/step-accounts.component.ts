import { Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings } from "ng-recaptcha";
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfileBanks } from 'src/app/core/models/profiles/profile-banks.model';
import { AccountCardComponent } from 'src/app/shared/components/account-card/account.card.component';
import { AuthService } from 'src/app/core/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountModalComponent } from 'src/app/pages/bank-accounts/personal/personal-account.component';
import { TermsDialogComponent } from '../terms/terms-dialog.component';
import { environment } from 'src/environments/environment';
import { RegisterStore } from '../register.store';

@Component({
    selector: 'register-step-accounts',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule,
        AccountCardComponent,
        RecaptchaModule,
        RecaptchaFormsModule,
    ],
    providers: [
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: { siteKey: environment.recaptcha.siteKey } as RecaptchaSettings,
        },
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Cuentas bancarias</h2>
      <p class="auth-section__hint">Ya mismo terminamos, por último es necesario que registre dos cuentas bancarias {{ store.status() === 'natural' ? 'personales':'de empresa' }}: una en moneda nacional (PEN) y otra en moneda extranjera (USD).</p>
    </div>

    <div class="row" [formGroup]="group">
        <div class="col-md-6">
            <app-account-card
                currency="PEN"
                [account]="penAccount"
                (add)="openModal('PEN', 'create')"
                (edit)="openModal('PEN', 'edit', penAccount)">
            </app-account-card>
        </div>
        <div class="col-md-6">
            <app-account-card
                currency="USD"
                [account]="usdAccount"
                (add)="openModal('USD', 'create')"
                (edit)="openModal('USD', 'edit', usdAccount)">
            </app-account-card>
        </div>
        <div class="col-md-12 d-flex align-items-center justify-content-center m-t-8">
            <re-captcha formControlName="reCaptchaToken"></re-captcha>
        </div>
    </div>
    <div class="row m-t-12 m-b-16 d-flex align-items-center justify-content-center">
        <button type="button" mat-stroked-button color="primary" (click)="openTerms()"
            [disabled]="control['agreements'].value">
            <mat-icon>verified_user</mat-icon>
            {{ control['agreements'].value ? 'Términos aceptados' : 'Términos y Condiciones' }}
        </button>
    </div>
  `
})
export class StepAccountsComponent {
    @Input({ required: true }) group!: FormGroup;

    authService = inject(AuthService);
    store = inject(RegisterStore);
    status = this.store.status;

    get control() {
        return this.group.controls;
    }

    get accountsControl() {
        return this.control['profileBanks'] as FormControl;
    }

    get penAccount() {
        return this.accountsControl?.value?.find((a: ProfileBanks) => a.coinId === 'PEN');
    }

    get usdAccount() {
        return this.accountsControl?.value?.find((a: ProfileBanks) => a.coinId === 'USD');
    }

    constructor(private dialog: MatDialog) { }

    openModal(coind: string, mode: string, account?: ProfileBanks) {
        this.dialog.open(AccountModalComponent, {
            disableClose: true,
            data: {
                coinId: coind,
                banks: this.authService.authTable()?.banks ?? [],
                companyBanks: this.authService.authTable()?.companyBanks ?? [],
                documentTypes: this.authService.authTable()?.documentTypes.filter(d => d.isNatural),
                mode: mode,
                account: account,
                isNatural: this.status() === 'natural'
            }
        }).afterClosed().subscribe((payload: ProfileBanks) => {
            if (payload) {
                const accounts = this.accountsControl?.value ?? [];
                payload.documentTypeId = this.group.parent?.get(this.store.status() === 'natural' ? 'step3.documentTypeId':'step1.documentTypeId')?.value ?? null;
                payload.documentNumber = this.group.parent?.get(this.store.status() === 'natural' ? 'step3.documentNumber':'step1.documentNumber')?.value ?? null;
                payload.name = this.group.parent?.get(this.store.status() === 'natural' ? 'step3.names':'step1.names')?.value ?? null;
                const lastNames = this.store.status() === 'natural' ? (this.group.parent?.get('step3.lastNamePaterno')?.value + ' ' + this.group.parent?.get('step3.lastNameMaterno')?.value) : '';
                payload.lastName = lastNames ?? null;
                const index = accounts.findIndex((a: ProfileBanks) => a.coinId === payload.coinId);
                if (index >= 0) {
                    accounts[index] = payload;
                } else {
                    accounts.push(payload);
                }
                this.accountsControl?.setValue(accounts);
            }
        });
    }

    openTerms(): void {
        const dialogRef = this.dialog.open(TermsDialogComponent, {
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.control['agreements'].setValue(true);
            }
        });

    }
}