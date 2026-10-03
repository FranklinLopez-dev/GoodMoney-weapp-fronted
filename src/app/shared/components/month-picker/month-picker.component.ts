import { Component, Input, Optional } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { DateMaskDirective } from '../../directives/date-mask.directive';

export const DATE_FORMAT_MMYYYY = {
    parse: {
        dateInput: 'MM/yyyy'
    },
    display: {
        dateInput: 'MM/yyyy',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'MM/yyyy',
        monthYearA11yLabel: 'MMMM yyyy'
    }
};

@Component({
    selector: 'app-month-picker',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        DateMaskDirective
    ],
    providers: [
        { provide: MAT_DATE_FORMATS, useValue: DATE_FORMAT_MMYYYY }
    ],
    template: `
    <mat-form-field appearance="outline" class="w-100">
        <mat-label>{{ label }}</mat-label>

        <input matInput [formControl]="control" appDateMask mode="month" maxlength="7" [matDatepicker]="picker" />

        <mat-datepicker-toggle matIconSuffix [for]="picker" />

        <mat-datepicker #picker startView="multi-year" (monthSelected)="setMonthAndYear($event, picker)"
            panelClass="month-picker" />

        @if (control.touched && control.invalid) {
        <mat-hint class="su-error">
            @if (control.errors?.['required']) {
            {{ errorMessage }}
            }
            @if (control.errors?.['rangeInvalid']) {
            La fecha "Desde" no puede ser mayor que "Hasta"
            }
        </mat-hint>
        }

    </mat-form-field>
  `
})
export class MonthPickerComponent {
    @Input({ required: true }) control!: FormControl<Date | null>;
    @Input() label = 'Mes';
    @Input() errorMessage = 'Mes inválido';

    setMonthAndYear(date: Date, datepicker: MatDatepicker<Date>) {
        const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
        this.control.setValue(newDate);
        datepicker.close();
    }
}
