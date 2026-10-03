import { Component, computed, inject, Input, signal, OnInit, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

@Component({
    selector: 'register-juridico-step7-ejecutante',
    standalone: true,
    imports: [
        InputMaskDirective,
        TrimDirective,
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule
    ],
    template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Beneficiario final</h2>
      <p class="auth-section__hint">Para poder confirmar tu identidad, compárte tu documento de identidad.</p>
    </div>

    <div class="row" [formGroup]="group">
        <div class="col-md-4">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Tipo de documento</mat-label>
                <mat-select formControlName="documentTypeBenefId" (selectionChange)="setDocumentType($event.value)">
                    @for(option of documentTypes(); track option.code) {
                    <mat-option [value]="option.id">{{ option.name
                        }}</mat-option>
                    }
                </mat-select>
                @if(control['documentTypeBenefId'].touched &&
                control['documentTypeBenefId'].invalid) {
                <mat-hint class="su-error">
                    @if( control['documentTypeBenefId'].errors &&
                    control['documentTypeBenefId'].errors['required'])
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
                <input matInput formControlName="documentNumberBenef" [maxLengthValue]="documentType()?.sizeMax!"
                    [appInputMask]="documentType()?.isNumeric ? 'numeric' : 'text'" />
                @if(control['documentNumberBenef'].touched && control['documentNumberBenef'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(
                    control['documentNumberBenef'],
                    'Número de ' + (documentType()?.name ?? 'documento')) }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-12">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="namesBenef" maxlength="100" appTrim />
                @if(control['namesBenef'].touched && control['namesBenef'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['namesBenef'], 'Nombres') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Paterno</mat-label>
                <input matInput formControlName="lastNamePaternoBenef" maxlength="100" appTrim />
                @if(control['lastNamePaternoBenef'].touched &&
                control['lastNamePaternoBenef'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNamePaternoBenef'], 'Apellido Paterno') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Materno</mat-label>
                <input matInput formControlName="lastNameMaternoBenef" maxlength="100" appTrim />
                @if(control['lastNameMaternoBenef'].touched &&
                control['lastNameMaternoBenef'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNameMaternoBenef'], 'Apellido Materno') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>

    </div>
  `
})

export class JuridicoStep7EjecutanteComponent implements OnInit {
    @Input({ required: true }) group!: FormGroup;

    authService = inject(AuthService);
    validatorsService = inject(DynamicValidatorsService);
    private destroyRef = inject(DestroyRef);

    documentTypes = computed(() =>
        this.authService.authTable()?.documentTypes.filter(d => d.isNatural) ?? []
    );

    documentType = signal<DocumentType | null>(null);

    get control() {
        return this.group.controls;
    }

    isMe = computed(() =>
        this.group.parent?.get('step6.isMe')?.value ?? false
    );

    ngOnInit() {

        const documentTypeCtrl = this.control['documentTypeBenefId'] as FormControl;

        if (!documentTypeCtrl.value) {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            documentTypeCtrl.setValue(defaultType?.id ?? null);
        } else {
            const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
            this.documentType.set(selected);
        }

        const documentNumberCtrl = this.group.get('documentNumberBenef') as FormControl;
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
                    this.control['namesBenef'].setValue(response.data.nombres);
                    this.control['lastNamePaternoBenef'].setValue(response.data.apellido_paterno);
                    this.control['lastNameMaternoBenef'].setValue(response.data.apellido_materno);
                }
            });
    }

    setDocumentType(id: number) {
        const type = this.documentTypes().find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.group.get('documentNumberBenef') as FormControl;
        this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
    }

}
