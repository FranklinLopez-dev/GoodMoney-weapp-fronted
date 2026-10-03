import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { Country, Ubigeo } from 'src/app/core/models';
import { CountryService } from 'src/app/shared/services/country.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
    standalone: true,
    imports: [MaterialModule, SelectSearchAsyncComponent, ReactiveFormsModule],
    selector: 'app-address-section',
    templateUrl: './address.section.html'
})
export class AddressSectionComponent implements OnInit {

    @Input({ required: true }) form!: FormGroup;

    store = inject(ProfilesTablesStore);
    private ubigeos = inject(UbigeosService);
    private countryService = inject(CountryService);
    private destroyRef = inject(DestroyRef);

    countries = this.countryService.countries;
    departments = computed(() =>
        this.store.tables()?.departaments ?? []
    );

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
    }

    ngOnInit(): void {
        if (this.control['departament'].value) {
            this.loadInitialProvinces(this.control['departament'].value);
        }

        if (this.control['province'].value) {
            this.loadInitialDistricts(this.control['province'].value);
        }

        this.control['departament'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(code => {
                this.provinces.set([]);
                this.districts.set([]);
                if (this.control['departament'].dirty) {
                    this.control['province'].reset();
                    this.control['district'].reset();
                }
                this.control['province'].disable();
                this.control['district'].disable();
                this.loadInitialProvinces(code);
            });

        this.control['province'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(code => {
                this.districts.set([]);
                if (this.control['province'].dirty) {
                    this.control['district'].reset();
                }
                this.control['district'].disable();
                this.loadInitialDistricts(code);
            });
    }

    loadCountries = (search: string) => {
        this.filteredCountries = this.countries().filter(c =>
            c.name.common.toLowerCase().includes(search.toLowerCase())
        );
    };

    private loadInitialProvinces(code: string) {
        this.ubigeos.getProvinces(code).subscribe(res => {
            this.provinces.set(res);
            this.control['province'].enable();
        });
    }

    private loadInitialDistricts(code: string) {
        this.ubigeos.getDistricts(code).subscribe(res => {
            this.districts.set(res);
            this.control['district'].enable();
        });
    }

}
