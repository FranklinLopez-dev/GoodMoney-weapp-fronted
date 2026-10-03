import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Lo que exige el backend (IdentityOptions en Startup.cs); si cambia allí, cambia aquí. */
export const REGLAS_CONTRASENA = {
    largoMinimo: 8,
    pideLetra: true,
    pideNumero: true
};

export class PasswordValidators {
    static isEmptyInputValue(value: any): boolean {
        return value == null || value.length === 0;
    }

    /** Misma política que Identity: sin esto el backend rechazaba la contraseña con el formulario ya enviado. */
    static politica(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const valor = (control.value ?? '') as string;

            if (PasswordValidators.isEmptyInputValue(valor)) return null;

            const faltas: string[] = [];

            if (valor.length < REGLAS_CONTRASENA.largoMinimo)
                faltas.push(`al menos ${REGLAS_CONTRASENA.largoMinimo} caracteres`);

            if (REGLAS_CONTRASENA.pideLetra && !/[a-zñ]/i.test(valor))
                faltas.push('una letra');

            if (REGLAS_CONTRASENA.pideNumero && !/\d/.test(valor))
                faltas.push('un número');

            return faltas.length ? { politica: faltas } : null;
        };
    }

    /** Texto para pintar debajo del campo, con lo que falta o lo que se pide. */
    static describirFaltas(faltas: string[] | undefined): string {
        if (!faltas?.length) return '';
        return faltas.length === 1
            ? `Falta ${faltas[0]}.`
            : `Faltan ${faltas.slice(0, -1).join(', ')} y ${faltas.at(-1)}.`;
    }

    static mustMatch(controlPath: string, matchingControlPath: string): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const control = formGroup.get(controlPath);
            const matchingControl = formGroup.get(matchingControlPath);

            if (!control || !matchingControl) {
                return null;
            }

            if (matchingControl.hasError('mustMatch')) {
                delete matchingControl.errors?.['mustMatch'];
                matchingControl.updateValueAndValidity();
            }

            if (this.isEmptyInputValue(matchingControl.value) || control.value === matchingControl.value) {
                return null;
            }

            const errors = { mustMatch: true };
            matchingControl.setErrors(errors);

            return errors;
        };
    }
}
