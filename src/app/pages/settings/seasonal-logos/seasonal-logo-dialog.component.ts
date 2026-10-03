import { Component, Inject, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { SeasonalLogo } from './seasonal-logos.service';

/** Tope de la imagen: el logo vigente viaja en `/api/companies/client`, que la app pide en cada arranque. */
const MAX_IMAGEN_BYTES = 200 * 1024;

/** "Hasta" antes que "Desde" no es un rango: nunca quedaría vigente. */
function rangoValido(control: AbstractControl): ValidationErrors | null {
    const desde = control.get('from')?.value;
    const hasta = control.get('to')?.value;
    if (!desde || !hasta) return null;
    return desde <= hasta ? null : { rangoInvertido: true };
}

/** La imagen es obligatoria al crear y opcional al editar, mismo criterio que `SeasonalLogosController.Put`. */
@Component({
    selector: 'app-seasonal-logo-dialog',
    standalone: true,
    imports: [MaterialModule, ReactiveFormsModule],
    template: `
    <h2 mat-dialog-title>{{ data ? 'Editar logo de temporada' : 'Nuevo logo de temporada' }}</h2>

    <mat-dialog-content [formGroup]="form" class="logo-form">

      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" placeholder="Fiestas Patrias" />
      </mat-form-field>

      <div class="logo-form__imagen">
        @if (previa(); as src) {
        <img [src]="src" alt="" class="logo-form__preview" />
        } @else {
        <span class="text-muted">Sin imagen</span>
        }
        <div>
          <input type="file" accept="image/png" (change)="onArchivo($event)" />
          @if (errorArchivo(); as error) {
          <p class="logo-form__error">{{ error }}</p>
          } @else {
          <p class="logo-form__ayuda">Solo PNG: es el único formato con el que se guarda y se vuelve a mostrar.</p>
          }
        </div>
      </div>

      <div class="logo-form__fechas">
        <mat-form-field appearance="outline">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="desde" formControlName="from" />
          <mat-datepicker-toggle matIconSuffix [for]="desde" />
          <mat-datepicker #desde />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="hasta" formControlName="to" />
          <mat-datepicker-toggle matIconSuffix [for]="hasta" />
          <mat-datepicker #hasta />
        </mat-form-field>
      </div>

      @if (form.errors?.['rangoInvertido']) {
      <p class="logo-form__error">La fecha "Hasta" no puede ser anterior a "Desde".</p>
      }

      <mat-slide-toggle class="logo-form__activo" formControlName="isActive">
        Activo
      </mat-slide-toggle>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || (!data && !imagenNueva())"
        (click)="guardar()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .logo-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      padding-top: 8px;
    }

    .logo-form__imagen {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }

    /* El input de archivo nativo no encoge por sí solo y desbordaba el diálogo en móvil. */
    .logo-form__imagen > div {
      flex: 1 1 200px;
      min-width: 0;
    }

    .logo-form__imagen input[type='file'] {
      max-width: 100%;
    }

    .logo-form__preview {
      max-width: 160px;
      max-height: 80px;
      object-fit: contain;
      border: 1px solid var(--gm-plomo-100, #E6E6E6);
      border-radius: 8px;
    }

    .logo-form__fechas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 480px) {
      .logo-form__fechas {
        grid-template-columns: 1fr;
        gap: 4px;
      }
    }

    .logo-form__activo {
      margin: 4px 0 8px;
    }

    .logo-form__ayuda {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--gm-plomo-400);
    }

    .logo-form__error {
      margin: 0 0 8px;
      font-size: 12.5px;
      color: var(--gm-error, #D32F2F);
    }
  `],
})
export class SeasonalLogoDialogComponent {

    private fb = inject(FormBuilder);

    /** Base64 sin prefijo, listo para mandar al API. Null = no se cambió. */
    readonly imagenNueva = signal<string | null>(null);
    /** data: URL para el <img>, ya sea la existente o la recién elegida. */
    readonly previa = signal<string | null>(
        this.data ? `data:image/png;base64,${this.data.image}` : null
    );

    form = this.fb.group({
        name: [this.data?.name ?? '', Validators.required],
        from: [this.data ? new Date(this.data.from) : null, Validators.required],
        to: [this.data ? new Date(this.data.to) : null, Validators.required],
        isActive: [this.data?.isActive ?? true],
    }, { validators: rangoValido });

    constructor(
        public ref: MatDialogRef<SeasonalLogoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SeasonalLogo | null,
    ) { }

    readonly errorArchivo = signal<string | null>(null);

    onArchivo(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        // El backend guarda solo los bytes, sin el tipo: un SVG se volvería a mostrar etiquetado como PNG y saldría roto.
        if (file.type !== 'image/png') {
            this.errorArchivo.set('El archivo tiene que ser PNG.');
            input.value = '';
            return;
        }

        // Mismo tope que el API. Comodidad, no control: el del servidor es el que manda.
        if (file.size > MAX_IMAGEN_BYTES) {
            const kb = Math.round(file.size / 1024);
            this.errorArchivo.set(`La imagen pesa ${kb} KB y el máximo son 200 KB. Expórtala más pequeña.`);
            input.value = '';
            return;
        }

        this.errorArchivo.set(null);

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const dataUrl: string = e.target.result;
            this.previa.set(dataUrl);
            this.imagenNueva.set(dataUrl.split(',')[1]);
        };
        reader.readAsDataURL(file);
    }

    guardar(): void {
        if (this.form.invalid || (!this.data && !this.imagenNueva())) return;

        const valores = this.form.getRawValue();

        this.ref.close({
            name: valores.name,
            from: valores.from,
            to: valores.to,
            isActive: valores.isActive,
            ...(this.imagenNueva() ? { image: this.imagenNueva() } : {}),
        });
    }
}
