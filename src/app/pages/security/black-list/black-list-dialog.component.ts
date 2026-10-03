import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { BlackListService } from './black-list.service';
import { BlackListStore } from './black-list.store';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { DocumentType } from 'src/app/core/models';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';

@Component({
    selector: 'app-activities-dialog',
    standalone: true,
    imports: [
        MaterialModule,
        ReactiveFormsModule,
        InputMaskDirective
    ],
    template: `
    <h2 mat-dialog-title>Agregar a lista negra</h2>
    <form [formGroup]="form" class="p-24">
        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Tipo de documento</mat-label>
            <mat-select formControlName="documentTypeId" (selectionChange)="setDocumentType($event.value)">
                @for(option of documentTypes(); track option.code) {
                <mat-option [value]="option.id">{{ option.name
                    }}</mat-option>
                }
            </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Número de {{documentType()?.name ? documentType()?.name:'documento'}}</mat-label>
            <input matInput formControlName="documentNumber" [maxLengthValue]="documentType()?.sizeMax!"
                [appInputMask]="documentType()?.isNumeric ? 'numeric' : 'text'" />
                @if(control['documentNumber'].touched && control['documentNumber'].invalid) {
                <mat-hint class="su-error">
                    {{ validators.getErrorMessage(
                    control['documentNumber'],
                    'Número de ' + (documentType()?.name ?? 'documento')) }}
                </mat-hint>
                }
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Correo electrónico</mat-label>
            <input type="email" matInput formControlName="email" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Celular</mat-label>
             <input [appInputMask]="'numeric'" formControlName="cellPhone" matInput>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Motivo</mat-label>
            <textarea matInput formControlName="reason" cdkTextareaAutosize></textarea>
        </mat-form-field>

    </form>
    <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Guardando...' : 'Guardar' }}
        </button>
    </mat-dialog-actions>
  `
})
export class BlackListDialogComponent {

    protected store = inject(BlackListStore);
    private service = inject(BlackListService);
    private toastr = inject(ToastrService);
    documentTypes = this.store.documentTypes;
    documentType = signal<DocumentType | null>(null);

    form = this.fb.nonNullable.group({
        documentTypeId: [null],
        documentNumber: [null],
        cellPhone: [null],
        email: [null, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)],
        reason: [null],
    });

    get control() {
        return this.form.controls;
    }

    loading = signal(false);

    constructor(
        public validators: DynamicValidatorsService,
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<BlackListDialogComponent>
    ) { }

    save(): void {
        if (this.form.invalid || this.loading()) return;

        this.loading.set(true);

        const payload: any = this.form.getRawValue();

        this.service.create(payload).pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (response) => {
                    this.toastr.success('Usuario agregado a la lista negra', 'Éxito');
                    this.dialogRef.close(true);
                }
            });

    }

    cancel(): void {
        this.dialogRef.close(null);
    }

    setDocumentType(id: number) {
        const type = this.documentTypes()?.find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.form.get('documentNumber') as FormControl;
        this.validators.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type, false));
    }
}
