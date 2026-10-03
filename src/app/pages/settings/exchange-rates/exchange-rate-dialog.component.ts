import { Component, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { MaterialModule } from "src/app/material.module";

/** Rango sano para PEN por USD: sin ceros, negativos ni dedazos tipo 18 222. */
const TASA_MINIMA = 0.01;
const TASA_MAXIMA = 100;

function ventaNoMenorQueCompra(group: AbstractControl): ValidationErrors | null {
  const compra = Number(group.get('priceCompra')?.value);
  const ventaCtrl = group.get('priceVenta');
  const venta = ventaCtrl?.value;

  const errores = { ...(ventaCtrl?.errors ?? {}) };
  delete errores['ventaMenor'];

  if (compra && venta != null && venta !== '' && Number(venta) < compra) {
    ventaCtrl?.setErrors({ ...errores, ventaMenor: true });
    return { ventaMenor: true };
  }

  ventaCtrl?.setErrors(Object.keys(errores).length ? errores : null);
  return null;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule],
  template: `
  <h2 mat-dialog-title>Nuevo tipo de cambio</h2>

  <form [formGroup]="form" class="p-24">

    <mat-form-field appearance="outline" class="w-100">
        <mat-label>Compra</mat-label>
        <input matInput type="number" formControlName="priceCompra">
        @if(control['priceCompra'].touched &&
        control['priceCompra'].invalid) {
        <mat-hint class="su-error">
            @if(control['priceCompra'].errors?.['required']) {
            Compra es obligatorio
            }
            @if(control['priceCompra'].errors?.['min'] || control['priceCompra'].errors?.['pattern']) {
            Debe ser mayor que 0, con máximo 4 decimales
            }
            @if(control['priceCompra'].errors?.['max']) {
            No puede ser mayor que {{ tasaMaxima }}
            }
        </mat-hint>
        }
    </mat-form-field>

    <mat-form-field appearance="outline" class="w-100">
        <mat-label>Venta</mat-label>
        <input matInput type="number" [min]="control['priceCompra'].value" formControlName="priceVenta">
        @if(control['priceVenta'].touched &&
        control['priceVenta'].invalid) {
        <mat-hint class="su-error">
            @if(control['priceVenta'].errors?.['required']) {
            Venta es obligatorio
            }
            @if(control['priceVenta'].errors?.['min'] || control['priceVenta'].errors?.['pattern']) {
            Debe ser mayor que 0, con máximo 4 decimales
            }
            @if(control['priceVenta'].errors?.['max']) {
            No puede ser mayor que {{ tasaMaxima }}
            }
            @if(control['priceVenta'].errors?.['ventaMenor']) {
            La venta no puede ser menor que la compra
            }
        </mat-hint>
        }
    </mat-form-field>
  </form>

  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancelar</button>
    <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
      {{ loading() ? 'Guardando...' : 'Guardar' }}
    </button>
  </div>
  `
})
export class ExchangeRatesDialogComponent {

  loading = signal(false);
  readonly tasaMaxima = TASA_MAXIMA;

  form = this.fb.nonNullable.group({
    priceCompra: [null, [Validators.required, Validators.min(TASA_MINIMA),
      Validators.max(TASA_MAXIMA), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
    priceVenta: [null, [Validators.required, Validators.min(TASA_MINIMA),
      Validators.max(TASA_MAXIMA), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
  }, { validators: ventaNoMenorQueCompra });

  get control() {
    return this.form.controls;
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExchangeRatesDialogComponent>
  ) {}

  save() {
    this.dialogRef.close(this.form.getRawValue());
  }
}
