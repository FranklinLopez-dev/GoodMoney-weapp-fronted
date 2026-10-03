import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CompanyStore } from 'src/app/pages/settings/company/company.store';
import { TablerIconsModule } from 'angular-tabler-icons';
import { environment } from 'src/environments/environment';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
    selector: 'company-email-tab',
    templateUrl: './email.component.html'
})
export class CompanyEmailComponent {
    private baseUrl = environment.apiUrl;
    private store = inject(CompanyStore);
    private fb = inject(FormBuilder);

    company = computed(() => this.store.company()!);

    form = this.fb.nonNullable.group({
        emailPrimaryColor: [null, Validators.required],
        emailSecondaryColor: [null, Validators.required],
        emailBackgroundColor: [null, Validators.required],
        emailTextColor: [null, Validators.required],
        emailFooterText: [null, Validators.required],
        emailSupportEmail: [null, Validators.required],
        emailLogoUrlByte: [''],
        emailMascotUrlByte: [''],
    });

    get control() {
        return this.form.controls;
    }

    emailLogoUrl = signal<string | null>(null);
    emailMascotUrl = signal<string | null>(null);

    constructor() {
        this.initializeForm();
    }

    private initializeForm() {
        const c = this.store.company();
        if (c) {
            this.form.patchValue(c as any);

            if (c.emailLogoUrl) {
                this.emailLogoUrl.set(`${this.baseUrl}/${c.emailLogoUrl}`);
            }

            if (c.emailMascotUrl) {
                this.emailMascotUrl.set(`${this.baseUrl}/${c.emailMascotUrl}`);
            }

        }
    }

    setFileLogo(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.emailLogoUrl.set(e.target.result);
            this.control['emailLogoUrlByte'].setValue(this.emailLogoUrl()?.replace(/^data:image\/[a-z]+;base64,/, "")!);
        };
        reader.readAsDataURL(file);
    }

    removeFileLogo() {
        this.emailLogoUrl.set(null);
        this.control['emailLogoUrlByte'].reset();
    }

    setFileMascota(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64 = e.target.result;
            this.emailMascotUrl.set(base64);
            this.control['emailMascotUrlByte']
                .setValue(base64.replace(/^data:image\/[a-z]+;base64,/, ""));
        };
        reader.readAsDataURL(file);
    }

    removeFileMascota() {
        this.emailMascotUrl.set(null);
        this.control['emailMascotUrlByte'].reset();
    }

    markAllAsTouched() {
        this.form.markAllAsTouched();
    }

    save() {
        this.store.update(this.form.getRawValue() as any);
    }

}
