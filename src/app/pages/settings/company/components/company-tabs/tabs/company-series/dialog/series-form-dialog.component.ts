import { aEstadoApi } from 'src/app/shared/utils/estado';
import { Component, Inject, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { Serie } from "src/app/core/models";
import { MaterialModule } from "src/app/material.module";
import { SeriesService } from "src/app/pages/settings/company/series.service";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule],
  template: `
  <h2 mat-dialog-title>{{ data ? 'Editar serie' : 'Nueva serie' }}</h2>

  <form [formGroup]="form" class="p-24">
    <mat-form-field appearance="outline" class="w-100">
      <mat-label>Tipo de documento</mat-label>
      <mat-select placeholder="[ Selecionar ]" formControlName="code">
          <mat-option value="01">FACTURA ELECTRÓNICA</mat-option>
          <mat-option value="03">BOLETA DE VENTA ELECTRÓNICA</mat-option>
          <mat-option value="07">NOTA DE CRÉDITO (FC.. de facturas, BC.. de boletas)</mat-option>
      </mat-select>
      @if(control['code'].touched &&
      control['code'].invalid) {
      <mat-hint class="su-error">
          @if(control['code'].errors &&
          control['code'].errors['required']) {
          Tipo de documento es obligatorio
          }
      </mat-hint>
      }
  </mat-form-field>

  <mat-form-field appearance="outline" class="w-100">
      <mat-label>Serie</mat-label>
      <input matInput formControlName="serieNumber" minLength="4" maxLength="4">
      @if(control['serieNumber'].touched &&
      control['serieNumber'].invalid) {
      <mat-hint class="su-error">
          @if(control['serieNumber'].errors &&
          control['serieNumber'].errors['required']) {
          Serie es obligatorio
          }
          @if(control['serieNumber'].errors &&
          control['serieNumber'].errors['minlength']) {
          Debe tener 4 carácteres
          }
      </mat-hint>
      }
  </mat-form-field>

  <mat-form-field appearance="outline" class="w-100">
      <mat-label>Correlativo</mat-label>
      <input matInput type="number" formControlName="correlative">
      @if(control['correlative'].touched &&
      control['correlative'].invalid) {
      <mat-hint class="su-error">
          @if(control['correlative'].errors &&
          control['correlative'].errors['required']) {
          Correlativo es obligatorio
          }
      </mat-hint>
      }
  </mat-form-field>

  <mat-checkbox formControlName="isAutomated">Automático</mat-checkbox>
  </form>

  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancelar</button>
    <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
      {{ loading() ? 'Guardando...' : 'Guardar' }}
    </button>
  </div>
  `
})
export class SeriesFormDialogComponent {

  loading = signal(false);
  isEdit = !!this.data;

  private service = inject(SeriesService);
  private toastr = inject(ToastrService);

  form = this.fb.nonNullable.group({
    id: [null],
    code: ['', Validators.required],
    serieNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]],
    correlative: [null, Validators.required],
    isAutomated: [false]
  });

  get control() {
    return this.form.controls;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SeriesFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Serie | null
  ) {
    if (data) this.form.patchValue(data as any);
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
            this.toastr.success('Serie editada correctamente', 'Éxito');
          } else {
            this.toastr.success('Serie creada correctamente', 'Éxito');
          }
          this.dialogRef.close(payload);
        }
      });
  }
}
