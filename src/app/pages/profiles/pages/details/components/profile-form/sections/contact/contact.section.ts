import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { CountryService } from 'src/app/shared/services/country.service';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { Country } from 'src/app/core/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';

@Component({
    standalone: true,
    imports: [MaterialModule, ReactiveFormsModule, InputMaskDirective, TablerIconsModule, DateMaskDirective],
    selector: 'app-contact-section',
    templateUrl: './contact.section.html'
})
export class ContactSectionComponent implements OnInit {

    @Input({ required: true }) form!: FormGroup;

    private destroyRef = inject(DestroyRef);
    private countryService = inject(CountryService);
    countries = this.countryService.countries;
    selectedCountry = signal<Country | null>(null);

    maxBirthDate = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d;
    })();

    get control() {
        return this.form.controls;
    }

    constructor() { }

    ngOnInit(): void {
        this.selectedCountry.set(
            this.countries().find(c => c.cca2 === this.control['country'].value) || null
        );

        this.control['country'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(code => {
                this.selectedCountry.set(
                    this.countries().find(c => c.cca2 === code) || null
                );
            });

        this.control['isWhatsapp'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(isWhatsapp => {
                this.control['flagCellPhone'].setValue(false);
            });


    }

}
