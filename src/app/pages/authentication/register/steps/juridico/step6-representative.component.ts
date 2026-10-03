import { Component, computed, inject, Input, signal, OnInit, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthService } from 'src/app/core/auth/auth.service';
import { debounceTime, filter, switchMap } from 'rxjs';
import { DocumentType } from 'src/app/core/models/settings/document-type.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { VALIDADORES_NOMBRE } from 'src/app/shared/validators/texto.validators';

@Component({
    selector: 'register-juridico-step6-representative',
    standalone: true,
    imports: [
        InputMaskDirective,
        TrimDirective,
        DateMaskDirective,
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Representante legal</h2>
      <p class="auth-section__hint">Para poder confirmar la identidad del representante legal, compárte su documento de identidad.</p>
    </div>

    <div class="row" [formGroup]="group">
        <div class="col-md-4">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Tipo de documento</mat-label>
                <mat-select formControlName="documentTypeRepId" (selectionChange)="setDocumentType($event.value)">
                    @for(option of documentTypes(); track option.code) {
                    <mat-option [value]="option.id">{{ option.name
                        }}</mat-option>
                    }
                </mat-select>
                @if(control['documentTypeRepId'].touched &&
                control['documentTypeRepId'].invalid) {
                <mat-hint class="su-error">
                    @if( control['documentTypeRepId'].errors &&
                    control['documentTypeRepId'].errors['required'])
                    {
                    Tipo de documento es obligatorio
                    }
                </mat-hint>
                }
            </mat-form-field>
        </div>

        <div class="col-md-8">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Número de {{documentType()?.name ? documentType()?.name:'documento'}}</mat-label>
                <input matInput formControlName="documentNumberRep" [maxLengthValue]="documentType()?.sizeMax!"
                    [appInputMask]="documentType()?.isNumeric ? 'numeric' : 'text'" />
                @if(control['documentNumberRep'].touched && control['documentNumberRep'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(
                    control['documentNumberRep'],
                    'Número de ' + (documentType()?.name ?? 'documento')) }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-12">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="namesRep" maxlength="100" appTrim />
                @if(control['namesRep'].touched && control['namesRep'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['namesRep'], 'Nombres') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Paterno</mat-label>
                <input matInput formControlName="lastNamePaternoRep" maxlength="100" appTrim />
                @if(control['lastNamePaternoRep'].touched &&
                control['lastNamePaternoRep'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNamePaternoRep'], 'Apellido Paterno') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Materno</mat-label>
                <input matInput formControlName="lastNameMaternoRep" maxlength="100" appTrim />
                @if(control['lastNameMaternoRep'].touched &&
                control['lastNameMaternoRep'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNameMaternoRep'], 'Apellido Materno') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>

        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Fecha de nacimiento</mat-label>
                <input matInput appDateMask [max]="maxBirthDate" maxlength="10" placeholder="dd/mm/yyyy"
                    formControlName="dateOfBirth" [matDatepicker]="picker">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if(control['dateOfBirth'].touched && control['dateOfBirth'].invalid) {
                <mat-hint class="su-error">Fecha de nacimiento inválida</mat-hint>
                }
            </mat-form-field>
        </div>

        <div class="col-12">
            <div class="d-flex align-items-center">
                <div class="w-100">
                    <div class="d-flex align-items-center justify-content-center w-100">
                        <h5>Usted es el mismo representante legal</h5>
                        <mat-slide-toggle formControlName="isMe" class="m-l-auto"></mat-slide-toggle>
                    </div>
                </div>
            </div>
        </div>

    </div>
  `
})

export class JuridicoStep6RepresentativeComponent implements OnInit {
    @Input({ required: true }) group!: FormGroup;

    authService = inject(AuthService);
    validatorsService = inject(DynamicValidatorsService);
    private destroyRef = inject(DestroyRef);

    documentTypes = computed(() =>
        this.authService.authTable()?.documentTypes.filter(d => d.isNatural) ?? []
    );

    documentType = signal<DocumentType | null>(null);

    /** Mayoria de edad: el representante legal no puede ser menor. */
    maxBirthDate = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d;
    })();

    get control() {
        return this.group.controls;
    }

    ngOnInit() {

        const documentTypeCtrl = this.control['documentTypeRepId'] as FormControl;

        if (!documentTypeCtrl.value) {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            documentTypeCtrl.setValue(defaultType?.id ?? null);
        } else {
            const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
            this.documentType.set(selected);
        }

        const documentNumberCtrl = this.group.get('documentNumberRep') as FormControl;
        if (!documentNumberCtrl) return;

        this.validatorsService.applyValidators(
            documentNumberCtrl,
            mapDocumentToValidatable(this.documentType())
        );

        documentNumberCtrl.valueChanges
            .pipe(
                debounceTime(400),
                filter(() => this.documentType()?.code === '1'),
                filter(() => documentNumberCtrl.valid),
                switchMap(value => this.authService.getDni(value)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(response => {
                if (response?.success) {
                    this.control['namesRep'].setValue(response.data.nombres);
                    this.control['lastNamePaternoRep'].setValue(response.data.apellido_paterno);
                    this.control['lastNameMaternoRep'].setValue(response.data.apellido_materno);
                }
            });

        const isMeCtrl = this.group.get('isMe');

        this.toggleBeneficiaryValidators(isMeCtrl?.value ?? true);

        isMeCtrl?.valueChanges.subscribe(isMe => {
            this.toggleBeneficiaryValidators(isMe);
        });
    }

    setDocumentType(id: number) {
        const type = this.documentTypes().find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.group.get('documentNumberRep') as FormControl;
        this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
    }

    private toggleBeneficiaryValidators(isMe: boolean) {
        const validadores: Record<string, typeof VALIDADORES_NOMBRE> = {
            'step7.documentTypeBenefId': [Validators.required],
            'step7.documentNumberBenef': [Validators.required],
            'step7.namesBenef': VALIDADORES_NOMBRE,
            'step7.lastNamePaternoBenef': VALIDADORES_NOMBRE,
            'step7.lastNameMaternoBenef': VALIDADORES_NOMBRE,
        };

        Object.entries(validadores).forEach(([name, reglas]) => {
            const ctrl = this.group.parent?.get(name);
            if (!ctrl) return;

            if (!isMe) {
                ctrl.setValidators(reglas);
            } else {
                ctrl.clearValidators();
                ctrl.reset();
            }

            ctrl.updateValueAndValidity({ emitEvent: false });
        });
    }

}
