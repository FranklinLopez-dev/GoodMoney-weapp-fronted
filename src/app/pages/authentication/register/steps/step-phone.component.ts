import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CountryService } from 'src/app/shared/services/country.service';
import { Country } from 'src/app/core/models';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { RegisterStore } from '../register.store';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';

@Component({
    selector: 'register-step-phone',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule,
        InputMaskDirective,
        FallbackImgDirective
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Celular</h2>
      <p class="auth-section__hint">Lo usamos para darle seguridad a tu cuenta y avisarte del estado de tus operaciones.</p>
    </div>

    <div class="row" [formGroup]="group">
        <div class="col-12">
            <mat-form-field class="w-100" appearance="outline">
                <mat-label>Celular</mat-label>
                <input [appInputMask]="'numeric'" [maxLengthValue]="largoMaximo()" formControlName="cellPhone" matInput>
                <span class="m-r-4 gm-prefijo-pais" matPrefix>
                    <span class="d-flex align-items-center m-l-16 m-r-8">
                        <img class="option-image" fallbackImg="default" [src]="selectedCountry()?.flags?.svg" [alt]="selectedCountry()?.name?.common" class="option-image">
                        <span class="m-l-4 font-medium text-default">{{selectedCountry()?.idd?.root}}{{selectedCountry()?.idd?.suffixes?.[0]}}</span>
                    </span>
                </span>
                @if(control['cellPhone'].touched && control['cellPhone'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['cellPhone'], 'Celular') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-12">
            <div class="d-flex align-items-center">
                <div class="w-100">
                    <div class="d-flex align-items-center justify-content-center w-100">
                        <h5>Acepto recibir promociones de Good Money</h5>
                        <mat-slide-toggle formControlName="flagCellPhone" class="m-l-auto"></mat-slide-toggle>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
})
export class StepPhoneComponent implements OnInit {
    @Input({ required: true }) group!: FormGroup;

    countryService = inject(CountryService);
    countries = this.countryService.countries;
    selectedCountry = signal<Country | null>(null);
    validatorsService = inject(DynamicValidatorsService);
    store = inject(RegisterStore);

    get control() {
        return this.group.controls;
    }

    countryId = computed(() =>
        this.group.parent?.get(this.store.status() === 'natural' ? 'step5.country' : 'step4.country')?.value ?? ''
    );

    readonly largoMaximo = signal(15);

    ngOnInit() {
        this.selectedCountry.set(
            this.countries().find(c => c.cca2 === this.countryId()) || null
        );

        this.aplicarLargoPorPais();
    }

    /** Un celular peruano tiene exactamente 9 dígitos; para otros países vale el rango genérico E.164. */
    private aplicarLargoPorPais(): void {
        const esPeru = (this.countryId() || 'PE') === 'PE';
        this.largoMaximo.set(esPeru ? 9 : 15);

        const ctrl = this.control['cellPhone'];
        ctrl.setValidators(esPeru
            ? [Validators.required, this.validatorsService.exactLengthValidator(9)]
            : [Validators.required, Validators.minLength(6), Validators.maxLength(15)]);
        ctrl.updateValueAndValidity({ emitEvent: false });
    }

}
