import { esEstadoActivo, aEstadoApi } from 'src/app/shared/utils/estado';
import { Component, signal, inject, Inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MaterialModule } from "src/app/material.module";
import { PaymentConditions } from "src/app/core/models";
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PaymentConditionsService } from "./payment-conditions.service";
import { PaymentConditionsStore } from "./payment-conditions.store";
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule],
    template: `
    <h2 mat-dialog-title>{{ data ? 'Editar método de pago' : 'Nuevo método de pago' }}</h2>

    <form [formGroup]="form" class="p-24">

        <div class="row">
            <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Código</mat-label>
                    <input matInput formControlName="code">
                    @if(control['code'].touched && control['code'].invalid) {
                    <mat-hint class="su-error">
                        @if(control['code'].errors?.['required']) {
                        Código es obligatorio
                        }
                        @if(control['code'].errors?.['repetido']) {
                        Ya existe un método de pago con este código
                        }
                    </mat-hint>
                    }
                </mat-form-field>
            </div>

            <div class="col-md-6">
                <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Referencia SUNAT</mat-label>
                    <input matInput formControlName="refSunat">
                    @if(control['refSunat'].touched && control['refSunat'].invalid) {
                    <mat-hint class="su-error">
                    Referencia SUNAT es obligatorio
                    </mat-hint>
                    }
                </mat-form-field>
            </div>

            <div class="col-12">
                <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Descripción</mat-label>
                    <input matInput formControlName="description">
                    @if(control['description'].touched && control['description'].invalid) {
                    <mat-hint class="su-error">
                        @if(control['description'].errors?.['required']) {
                        Descripción es obligatoria
                        }
                        @if(control['description'].errors?.['repetido']) {
                        Ya existe un método de pago con esta descripción
                        }
                    </mat-hint>
                    }
                </mat-form-field>
            </div>
        </div>

        <div class="row m-t-16">
            <div class="col-md-6">
            <mat-checkbox formControlName="isDefault">Por defecto</mat-checkbox>
            </div>
            <div class="col-md-6">
            <mat-checkbox formControlName="status">Estado</mat-checkbox>
            </div>
        </div>

    </form>

    <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Guardando...' : 'Guardar' }}
        </button>
    </div>
  `
})
export class PaymentConditionsDialogComponent {

    loading = signal(false);
    isEdit = !!this.data;
    fb = inject(FormBuilder);
    private service = inject(PaymentConditionsService);
    private toastr = inject(ToastrService);
    private store = inject(PaymentConditionsStore);

    form = this.fb.nonNullable.group({
        id: [null],
        code: ['', [Validators.required, this.repetido('code')]],
        description: ['', [Validators.required, this.repetido('description')]],
        status: [true],
        refSunat: ['', Validators.required],
        isDefault: [false],
    });

    get control() {
        return this.form.controls;
    }

    private repetido(campo: string): ValidatorFn {
        return noRepetido(() => this.store.items(), campo, () => this.data?.id);
    }

    constructor(
        private dialogRef: MatDialogRef<PaymentConditionsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PaymentConditions | null
    ) { }

    ngOnInit() {
        if (this.data) {
            this.form.patchValue(this.data as any);
            this.control['status'].setValue(esEstadoActivo(this.data.status));
        }
    }

    save(): void {
        if (this.form.invalid || this.loading()) return;

        this.loading.set(true);

        const payload: any = this.form.getRawValue();
        payload.status = aEstadoApi(payload.status);
        const request = this.isEdit
            ? this.service.update(payload)
            : this.service.create(payload);

        request
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: () => {
                    if (payload.id) {
                        this.toastr.success('Método de pago editado correctamente', 'Éxito');
                    } else {
                        this.toastr.success('Método de pago creado correctamente', 'Éxito');
                    }
                    this.dialogRef.close(payload);
                }
            });
    }

    cancel(): void {
        this.dialogRef.close(null);
    }

}