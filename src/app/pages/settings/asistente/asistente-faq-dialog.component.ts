import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { AsistenteFaq } from 'src/app/shared/components/asistente/asistente.service';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';

/** Las keywords alimentan el matching del widget y se piden aparte de la pregunta visible. */
@Component({
    selector: 'app-asistente-faq-dialog',
    standalone: true,
    imports: [MaterialModule, ReactiveFormsModule],
    template: `
    <h2 mat-dialog-title>{{ data ? 'Editar pregunta' : 'Nueva pregunta' }}</h2>

    <mat-dialog-content [formGroup]="form" class="faq-form">

      <mat-form-field appearance="outline">
        <mat-label>Pregunta</mat-label>
        <input matInput formControlName="question" placeholder="¿Cómo cambio mis dólares?" />
        @if(form.controls.question.touched && form.controls.question.errors?.['repetido']) {
        <mat-hint class="su-error">Ya existe una pregunta igual.</mat-hint>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Respuesta</mat-label>
        <textarea matInput formControlName="answer" rows="5"
          placeholder="La respuesta que dará el asistente"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Palabras clave (separadas por coma)</mat-label>
        <input matInput formControlName="keywords" placeholder="horario,atencion,hora" />
        <mat-hint>Con estas palabras el asistente reconoce la pregunta escrita libre.</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="faq-form__orden">
        <mat-label>Orden</mat-label>
        <input matInput type="number" formControlName="displayOrder" />
        <mat-hint>Las 4 primeras salen como sugerencias.</mat-hint>
      </mat-form-field>

      <mat-slide-toggle class="faq-form__activa" formControlName="isActive">
        Activa
      </mat-slide-toggle>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="guardar()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
    // Un campo por línea: en fila salían de 90 px de ancho y no se leía ni la pregunta ni la respuesta.
    styles: [`
    .faq-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .faq-form textarea {
      min-height: 120px;
      line-height: 1.6;
    }

    .faq-form__orden {
      /* Lo justo para que su texto de ayuda quepa en una línea: con 140 px se partía en tres. */
      width: 260px;
    }

    .faq-form__activa {
      margin: 10px 0 8px;
    }
  `],
})
export class AsistenteFaqDialogComponent {

    private fb = inject(FormBuilder);

    form = this.fb.group({
        question: [this.data?.question ?? '', [Validators.required,
            noRepetido(() => this.datos.existentes, 'question', () => this.data?.id)]],
        answer: [this.data?.answer ?? '', Validators.required],
        keywords: [this.data?.keywords ?? ''],
        displayOrder: [this.data?.displayOrder ?? 0],
        isActive: [this.data?.isActive ?? true],
    });

    get data(): AsistenteFaq | null {
        return this.datos.faq;
    }

    constructor(
        public ref: MatDialogRef<AsistenteFaqDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public datos: { faq: AsistenteFaq | null; existentes: AsistenteFaq[] },
    ) { }

    guardar(): void {
        if (this.form.invalid) return;
        this.ref.close(this.form.value);
    }
}
