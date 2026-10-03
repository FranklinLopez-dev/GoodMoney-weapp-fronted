import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CompanyStore } from 'src/app/pages/settings/company/company.store';
import { CountryService } from 'src/app/shared/services/country.service';
import { Country } from 'src/app/core/models';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule, InputMaskDirective],
    selector: 'company-contact-tab',
    templateUrl: './company-contact.component.html'
})
export class CompanyContactComponent {
    private store = inject(CompanyStore);
    private fb = inject(FormBuilder);

    company = computed(() => this.store.company()!);

    form = this.fb.nonNullable.group({
        emailAdress: ['', Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
        phone: [''],
        cellPhone: [''],
        webSite: [''],
        webSiteApp: ['']
    });

    get control() {
        return this.form.controls;
    }

    countryService = inject(CountryService);
    countries = this.countryService.countries;
    selectedCountry = signal<Country | null>(null);

    constructor() {
        this.initializeForm();

        effect(() => {
            const { country } = this.company();
            untracked(() => {
                this.selectedCountry.set(
                    this.countries().find(c => c.cca2 === country.toUpperCase()) || null
                );
            });
        });

    }

    private initializeForm() {
        const c = this.store.company();
        if (c) {
            this.form.patchValue(c);
        }
    }

    markAllAsTouched() {
        this.form.markAllAsTouched();
    }

    save() {
        this.store.update(this.form.getRawValue());
    }

}
