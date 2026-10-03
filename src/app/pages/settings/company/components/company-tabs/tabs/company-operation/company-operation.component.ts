import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CompanyStore } from 'src/app/pages/settings/company/company.store';
import { TablerIconsModule } from 'angular-tabler-icons';
import { environment } from 'src/environments/environment';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';

type PublicPhotoField =
  | 'photoPublicPcByte'
  | 'photoPublicTabletByte'
  | 'photoPublicPhoneByte';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
    selector: 'company-operation-tab',
    templateUrl: './company-operation.component.html'
})
export class CompanyOperationComponent {
    private baseUrl = environment.apiUrl;
    private store = inject(CompanyStore);
    private fb = inject(FormBuilder);

    company = computed(() => this.store.company()!);

    form = this.fb.nonNullable.group({
        operationTime: [null, Validators.required],
        minAmount: [null, Validators.required],
        maxAmount: [null, Validators.required],
        monthlyChange: [null, Validators.required],
        isClosed: [false],
        isDuplicated: [false],
        isModalPublic: [false],
        isMaintenance: [false],
        isOneAccount: [false],
        photoPublicPcByte: [''],
        photoPublicTabletByte: [''],
        photoPublicPhoneByte: [''],
        appIosUrl: [null],
        appAndroidUrl: [null],
    });

    get control() {
        return this.form.controls;
    }

    photoPublicPc = signal<string | null>(null);
    photoPublicTablet = signal<string | null>(null);
    photoPublicPhone = signal<string | null>(null);

    constructor() {
        this.initializeForm();
        this.handleModalPublicValidation();
    }

    private initializeForm() {
        const c = this.store.company();
        if (c) {
            this.form.patchValue(c as any);

            if (this.control['isModalPublic'].value) {
                this.handleModalPublicValidation();
                if (c.photoPublicPc) {
                    this.photoPublicPc.set(`${this.baseUrl}/${c.photoPublicPc}`);
                }

                if (c.photoPublicTablet) {
                    this.photoPublicTablet.set(`${this.baseUrl}/${c.photoPublicTablet}`);
                }

                if (c.photoPublicPhone) {
                    this.photoPublicPhone.set(`${this.baseUrl}/${c.photoPublicPhone}`);
                }
            }

        }
    }

    setFilePc(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.photoPublicPc.set(e.target.result);
            this.control['photoPublicPcByte'].setValue(this.photoPublicPc()?.replace(/^data:image\/[a-z]+;base64,/, "")!);
        };
        reader.readAsDataURL(file);
    }

    removeFilePc() {
        this.photoPublicPc.set(null);
        this.control['photoPublicPcByte'].reset();
    }

    setFileTablet(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64 = e.target.result;
            this.photoPublicTablet.set(base64);
            this.control['photoPublicTabletByte']
                .setValue(base64.replace(/^data:image\/[a-z]+;base64,/, ""));
        };
        reader.readAsDataURL(file);
    }

    removeFileTablet() {
        this.photoPublicTablet.set(null);
        this.control['photoPublicTabletByte'].reset();
    }

    setFilePhone(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const base64 = e.target.result;
            this.photoPublicPhone.set(base64);
            this.control['photoPublicPhoneByte']
                .setValue(base64.replace(/^data:image\/[a-z]+;base64,/, ""));
        };
        reader.readAsDataURL(file);
    }

    removeFilePhone() {
        this.photoPublicPhone.set(null);
        this.control['photoPublicPhoneByte'].reset();
    }

    markAllAsTouched() {
        this.form.markAllAsTouched();
    }

    save() {
        this.store.update(this.form.getRawValue() as any);
    }

    private handleModalPublicValidation() {
        const modalCtrl = this.control['isModalPublic'];

        modalCtrl.valueChanges.subscribe(enabled => {
            const required = enabled ? Validators.required : null;

            const photoFields: PublicPhotoField[] = [
                'photoPublicPcByte',
                'photoPublicTabletByte',
                'photoPublicPhoneByte'
            ];

            photoFields.forEach(field => {
                    const ctrl = this.control[field];
                    ctrl.setValidators(required);
                    ctrl.updateValueAndValidity();
                });
        });
    }
}
