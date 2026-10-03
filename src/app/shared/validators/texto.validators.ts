import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export class TextoValidators {

  /** Nombres y apellidos tal como vienen en el DNI: letras (con tildes y ñ), espacios, apóstrofe y guion. */
  static nombre(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value ?? '') as string;
      if (!valor) return null;
      return /^[a-záéíóúüñ' -]+$/i.test(valor) ? null : { soloLetras: true };
    };
  }
}

export const VALIDADORES_NOMBRE = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(100),
  TextoValidators.nombre()
];
