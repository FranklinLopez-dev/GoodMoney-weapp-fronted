import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function minArrayLength(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control || !Array.isArray(control.value)) return null;

        return control.value.length >= min
            ? null
            : { minArrayLength: true };
    };
}