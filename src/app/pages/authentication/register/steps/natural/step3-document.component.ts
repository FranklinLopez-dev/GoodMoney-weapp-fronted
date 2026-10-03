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
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';

@Component({
    selector: 'register-natural-step3-document',
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
    <div class="auth-section register-document-step">
      <h2 class="auth-section__title">Documento de identidad</h2>
      <p class="auth-section__hint">Para poder confirmar tu identidad, comparte tu documento de identidad.</p>
    </div>

    <div class="row register-document-step" [formGroup]="group">
        <div class="col-md-12 register-document-row">
            <div class="register-document-row__type">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Tipo de documento</mat-label>
                <mat-select formControlName="documentTypeId" (selectionChange)="setDocumentType($event.value)">
                    @for(option of documentTypes(); track option.code) {
                    <mat-option [value]="option.id">{{ option.name
                        }}</mat-option>
                    }
                </mat-select>
                @if(control['documentTypeId'].touched &&
                control['documentTypeId'].invalid) {
                <mat-hint class="su-error">
                    @if( control['documentTypeId'].errors &&
                    control['documentTypeId'].errors['required'])
                    {
                    Tipo de documento es obligatorio
                    }
                </mat-hint>
                }
            </mat-form-field>
            </div>

            <div class="register-document-row__number">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>{{ documentNumberLabel() }}</mat-label>
                <input matInput formControlName="documentNumber" [maxLengthValue]="documentType()?.sizeMax!"
                    [appInputMask]="documentType()?.isNumeric ? 'numeric' : 'text'" />
                @if(control['documentNumber'].touched && control['documentNumber'].invalid) {
                <mat-hint class="su-error">
                    Documento obligatorio
                </mat-hint>
                }
            </mat-form-field>
            </div>
        </div>
        <div class="col-md-12">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="names" maxlength="100" appTrim />
                @if(control['names'].touched && control['names'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['names'], 'Nombres') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Paterno</mat-label>
                <input matInput formControlName="lastNamePaterno" maxlength="100" appTrim />
                @if(control['lastNamePaterno'].touched &&
                control['lastNamePaterno'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNamePaterno'], 'Apellido Paterno') }}
                </mat-hint>
                }
            </mat-form-field>
        </div>
        <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
                <mat-label>Apellido Materno</mat-label>
                <input matInput formControlName="lastNameMaterno" maxlength="100" appTrim />
                @if(control['lastNameMaterno'].touched &&
                control['lastNameMaterno'].invalid) {
                <mat-hint class="su-error">
                    {{ validatorsService.getErrorMessage(control['lastNameMaterno'], 'Apellido Materno') }}
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
                <mat-hint class="su-error">Fecha de nacimiento invalida</mat-hint>
                }
            </mat-form-field>
        </div>
    </div>
  `,
    styles: [`
        .register-document-row {
            display: grid;
            grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.1fr);
            column-gap: 16px;
        }

        .register-document-row__type,
        .register-document-row__number {
            min-width: 0;
        }

        @media (max-width: 575.98px) {
            .register-document-row {
                grid-template-columns: 1fr;
                column-gap: 0;
            }
        }

        :host ::ng-deep .register-document-step .mat-mdc-form-field-subscript-wrapper {
            padding: 0 12px;
            min-height: 34px;
        }

        :host ::ng-deep .register-document-step .mat-mdc-form-field-hint-wrapper,
        :host ::ng-deep .register-document-step .mat-mdc-form-field-error-wrapper {
            display: block;
            padding: 6px 0 12px;
        }

        :host ::ng-deep .register-document-step .su-error {
            display: block;
            margin: 0;
            line-height: 1.25;
            text-align: left;
            text-indent: 0;
            overflow-wrap: anywhere;
        }
    `]
})

export class NaturalStep3DocumentComponent implements OnInit {
    @Input({ required: true }) group!: FormGroup;

    authService = inject(AuthService);
    validatorsService = inject(DynamicValidatorsService);
    private destroyRef = inject(DestroyRef);

    /** Mayoria de edad: no se puede abrir cuenta con menos de 18. */
    maxBirthDate = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d;
    })();

    documentTypes = computed(() =>
        this.authService.authTable()?.documentTypes.filter(d => d.isNatural) ?? []
    );

    documentType = signal<DocumentType | null>(null);

    documentNumberLabel(): string {
        return 'Número de documento';
    }

    get control() {
        return this.group.controls;
    }

    ngOnInit() {

        const documentTypeCtrl = this.control['documentTypeId'] as FormControl;

        if (!documentTypeCtrl.value) {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            documentTypeCtrl.setValue(defaultType?.id ?? null);
        } else {
            const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
            this.documentType.set(selected);
        }

        const documentNumberCtrl = this.group.get('documentNumber') as FormControl;
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
                    this.control['names'].setValue(response.data.nombres);
                    this.control['lastNamePaterno'].setValue(response.data.apellido_paterno);
                    this.control['lastNameMaterno'].setValue(response.data.apellido_materno);
                }
            });
    }

    setDocumentType(id: number) {
        const type = this.documentTypes().find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.group.get('documentNumber') as FormControl;
        this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
    }

}
