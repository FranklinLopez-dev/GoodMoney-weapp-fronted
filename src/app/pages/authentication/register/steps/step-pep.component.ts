import { Component, inject, Input, OnInit, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DynamicValidatorsService, IDynamicValidatable } from 'src/app/shared/services/dynamic-validators.service';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';

@Component({
    selector: 'register-step-pep',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule,
        TrimDirective
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Persona Expuesta Políticamente</h2>
      <p class="auth-section__hint">¿Desempeñas algún cargo en el estado? (P.E.P. = Persona Expuesta Políticamente)</p>
    </div>

    <div class="row" [formGroup]="group">

        <div class="col-12 m-b-16">
            <div class="d-flex align-items-center">
                <div class="m-l-16 w-100">
                    <h5 class="f-s-14 f-w-600 m-0 m-b-4">¿Es PEP?</h5>
                    <div class="d-flex align-items-center justify-content-center w-100">
                        <h6>{{"¿Ha cumplido, en los últimos 5 años: i) funciones públicas en un organismo público o ii) funciones prominentes en una organización internacional?"}}</h6>
                        <mat-slide-toggle formControlName="isPep" class="m-l-auto"></mat-slide-toggle>
                    </div>
                </div>
            </div>
        </div>

        @if(control['isPep'].value) {
        <div class="col-md-6">
            <mat-form-field class="w-100" appearance="outline">
                <mat-label>Institución</mat-label>
                <input maxlength="150" matInput formControlName="institution" appTrim>
                @if(control['institution'].touched && control['institution'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['institution'], 'Institución') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>

        <div class="col-md-6">
            <mat-form-field class="w-100" appearance="outline">
                <mat-label>Cargo</mat-label>
                <input maxlength="150" matInput formControlName="cargo" appTrim>
                @if(control['cargo'].touched && control['cargo'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['cargo'], 'Cargo') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        }

    </div>
  `
})
export class StepPepComponent implements OnInit {
    @Input({ required: true }) group!: FormGroup;

    validatorsService = inject(DynamicValidatorsService);
    private destroyRef = inject(DestroyRef);

    get control() {
        return this.group.controls;
    }

    ngOnInit() {
        const isPepCtrl = this.control['isPep'] as FormControl;
        const institutionCtrl = this.control['institution'] as FormControl;
        const cargoCtrl = this.control['cargo'] as FormControl;

        const applyValidators = (isPep: boolean) => {
            const validatable: IDynamicValidatable = {
                isRequired: isPep,
                sizeMin: 3
            };

            this.validatorsService.applyValidators(institutionCtrl, isPep ? validatable : null);
            this.validatorsService.applyValidators(cargoCtrl, isPep ? validatable : null);

            if (!isPep) {
                institutionCtrl.reset();
                cargoCtrl.reset();
            }
        };

        applyValidators(isPepCtrl.value);
        
        isPepCtrl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(isPep => applyValidators(isPep));
    }
}
