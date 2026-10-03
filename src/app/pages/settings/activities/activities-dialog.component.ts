import { esEstadoActivo, aEstadoApi } from 'src/app/shared/utils/estado';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';
import { Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Activities } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { ActivitiesService } from './activities.service';
import { ActivitiesStore } from './activities.store';

@Component({
  selector: 'app-activities-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
  ],
  template: `
  <h2 mat-dialog-title>{{ isEdit ? 'Editar Actividad' : 'Nueva Actividad' }}</h2>
  <form [formGroup]="form" class="p-24">
      <mat-form-field appearance="outline" class="w-100">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" placeholder="Ej: 6311" />
          @if(control['code'].touched && control['code'].invalid) {
          <mat-hint class="su-error">
              @if(control['code'].errors?.['required']) {
              Código es obligatorio
              }
              @if(control['code'].errors?.['repetido']) {
              Ya existe una actividad con este código
              }
          </mat-hint>
          }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-100">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" cdkTextareaAutosize></textarea>
          @if(control['description'].touched && control['description'].invalid) {
          <mat-hint class="su-error">
              @if(control['description'].errors?.['required']) {
              Descripción es obligatoria
              }
              @if(control['description'].errors?.['repetido']) {
              Ya existe una actividad con esta descripción
              }
          </mat-hint>
          }
      </mat-form-field>

      <mat-checkbox formControlName="status">
          Activo
      </mat-checkbox>
  </form>
  <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Guardando...' : 'Guardar' }}
      </button>
  </mat-dialog-actions>
  `
})
export class ActivitiesDialogComponent {

  private service = inject(ActivitiesService);
  private toastr = inject(ToastrService);
  private store = inject(ActivitiesStore);

  form = this.fb.nonNullable.group({
    id: [null],
    code: [null, [Validators.required, Validators.maxLength(10), this.repetido('code')]],
    description: [null, [Validators.required, this.repetido('description')]],
    status: [true]
  });

  get control() {
    return this.form.controls;
  }

  private repetido(campo: string): ValidatorFn {
    return noRepetido(() => this.store.items(), campo, () => this.data?.id);
  }

  loading = signal(false);
  isEdit = !!this.data;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActivitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Activities | null
  ) {
    if (data) {
      this.form.patchValue(data as any);
      this.control['status'].setValue(esEstadoActivo(data.status));
    }
  }

  save(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);

    const payload: any = this.form.getRawValue();
    payload.status = aEstadoApi(payload.status);

    this.isEdit
      ? this.service.update(payload).pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.toastr.success('Actividad editada correctamente', 'Éxito');
            this.dialogRef.close(payload);
          }
        })
      : this.service.create(payload).pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            this.toastr.success('Actividad creada correctamente', 'Éxito');
            this.dialogRef.close(response);
          }
        });

  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
