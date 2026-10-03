import { Component, inject, OnDestroy, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AuthAsideComponent } from '../aside/auth-aside.component';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [
        MaterialModule,
        TablerIconsModule,
        RouterModule,
        AuthAsideComponent
    ],
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnDestroy {

    public email: string | null = null;
    public isCopied = signal<boolean>(false);
    private copyTimeoutId: any = null;

    constructor(private authService: AuthService) {
        this.email = this.authService.emailSignUp();
    }

    goEmail() {
        if (!this.email) return;
        window.location.href = `mailto:${this.email}`;
    }

    goToSupport() {
        const phoneNumber = '51920001085';
        const whatsappUrl = `https://wa.me/${phoneNumber}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    copyEmail() {
        if (!this.email) return;
        try {
            navigator.clipboard.writeText(this.email);
            this.isCopied.set(true);
            if (this.copyTimeoutId) {
                clearTimeout(this.copyTimeoutId);
            }

            this.copyTimeoutId = setTimeout(() => {
                this.isCopied.set(false);
            }, 3000);
        } catch (_) {
        }
    }

    ngOnDestroy(): void {
        this.authService.setEmailSignUp(null);
    }
}
