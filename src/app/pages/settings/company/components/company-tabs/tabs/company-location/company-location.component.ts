import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { CompanyStore } from 'src/app/pages/settings/company/company.store';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { Country, Ubigeo } from 'src/app/core/models';
import { CountryService } from 'src/app/shared/services/country.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule, SelectSearchAsyncComponent],
    selector: 'company-location-tab',
    templateUrl: './company-location.component.html'
})
export class CompanyLocationComponent {
    private store = inject(CompanyStore);
    private fb = inject(FormBuilder);
    private ubigeos = inject(UbigeosService);
    private countryService = inject(CountryService);

    company = computed(() => this.store.company()!);
    countries = this.countryService.countries;

    departments = computed(() =>
        this.store.tables()?.departaments ?? []
    );

    form = this.fb.nonNullable.group({
        country: ['PE', Validators.required],
        departament: ['', Validators.required],
        province: ['', Validators.required],
        district: ['', Validators.required],
        address: ['', Validators.required]
    });

    get control() {
        return this.form.controls;
    }

    get countryControl(): FormControl {
        return this.control['country'] as FormControl;
    }

    provinces = signal<Ubigeo[]>([]);
    districts = signal<Ubigeo[]>([]);
    filteredCountries: Country[] = [];

    constructor() {
        this.filteredCountries = this.countries();

        this.initializeForm();

        effect(() => {
            const { country, departament, province, district, address } = this.company();
            untracked(() => {
                const currentValues = this.form.getRawValue();

                if (departament !== currentValues.departament || address !== currentValues.address) {
                    this.form.patchValue({
                        country: country?.toUpperCase() ?? 'PE',
                        departament: departament ?? '',
                        province: province ?? '',
                        district: district ?? '',
                        address: address ?? ''
                    }, { emitEvent: false });

                    if (departament) this.loadInitialProvinces(departament);
                    if (province) this.loadInitialDistricts(province);
                }
            });
        });
    }

    private initializeForm() {
        const c = this.store.company();
        if (c) {
            this.form.patchValue({
                country: c.country?.toUpperCase() ?? 'PE',
                departament: c.departament ?? '',
                province: c.province ?? '',
                district: c.district ?? '',
                address: c.address ?? ''
            }, { emitEvent: false });

            if (c.departament) this.loadInitialProvinces(c.departament);
            if (c.province) this.loadInitialDistricts(c.province);
            this.save();
        }
    }

    loadCountries = (search: string) => {
        this.filteredCountries = this.countries().filter(c =>
            c.name.common.toLowerCase().includes(search.toLowerCase())
        );
    };

    private loadInitialProvinces(code: string) {
        this.ubigeos.getProvinces(code).subscribe(res => {
            this.provinces.set(res);
            this.control.province.enable();
        });
    }

    private loadInitialDistricts(code: string) {
        this.ubigeos.getDistricts(code).subscribe(res => {
            this.districts.set(res);
            this.control.district.enable();
        });
    }

    onDepartmentChange(departmentCode: string) {
        this.provinces.set([]);
        this.districts.set([]);
        this.control.province.reset();
        this.control.district.reset();
        this.control.district.disable();

        if (!departmentCode) {
            this.control.province.disable();
            return;
        }

        this.control.province.disable();

        this.ubigeos.getProvinces(departmentCode).subscribe({
            next: res => {
                this.provinces.set(res);
                this.control.province.enable();
            },
        });
    }

    onProvinceChange(provinceCode: string) {
        this.districts.set([]);
        this.control.district.reset();

        if (!provinceCode) {
            this.control.district.disable();
            return;
        }

        this.control.district.disable();

        this.ubigeos.getDistricts(provinceCode).subscribe({
            next: res => {
                this.districts.set(res);
                this.control.district.enable();
            },
        });
    }

    markAllAsTouched() {
        this.form.markAllAsTouched();
    }

    save() {
        this.store.update(this.form.getRawValue());
    }
}
