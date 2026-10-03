import { Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Roles } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { RolesService } from './roles.service';
import { RolesStore } from './roles.store';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';

@Component({
  selector: 'app-roles-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
  ],
  template: `
  <h2 mat-dialog-title>{{ isEdit ? 'Editar Rol' : 'Nuevo Rol' }}</h2>
  <form [formGroup]="form" class="p-24">
      <mat-form-field appearance="outline" class="w-100">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Administrator" />
          @if(control['name'].touched && control['name'].invalid) {
          <mat-hint class="su-error">
              @if(control['name'].errors?.['required']) {
              Nombre es obligatorio
              }
              @if(control['name'].errors?.['repetido']) {
              Ya existe un rol con este nombre
              }
          </mat-hint>
          }
      </mat-form-field>

      <mat-checkbox formControlName="isDefault">
           ¿Default?
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
export class RolesDialogComponent {

  private service = inject(RolesService);
  private toastr = inject(ToastrService);
  private store = inject(RolesStore);

  form = this.fb.nonNullable.group({
    id: [null],
    name: ['', [Validators.required,
      noRepetido(() => this.store.items(), 'name', () => this.data?.id)]],
    isDefault: [false]
  });

  get control() {
    return this.form.controls;
  }

  loading = signal(false);
  isEdit = !!this.data;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RolesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Roles | null
  ) {
    if (data) {
      this.form.patchValue(data as any);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    const payload = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.service.update(payload as any)
      : this.service.create(payload as any);

    request$
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (response == 'OK') {
            this.toastr.success(
              this.isEdit ? 'Rol actualizado correctamente' : 'Rol creado correctamente',
              'Éxito'
            );
            this.dialogRef.close(true);
          } else {
            this.toastr.warning(response, 'Advertencia');
          }
        }
      });
  }
}
