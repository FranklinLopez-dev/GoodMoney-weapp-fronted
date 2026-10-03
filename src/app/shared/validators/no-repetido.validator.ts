import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Marca `repetido` si otro registro repite `campo`, sin mayúsculas ni espacios; `idActual` excluye al propio. */
export function noRepetido(
  items: () => ReadonlyArray<Record<string, any>> | null | undefined,
  campo: string,
  idActual: () => unknown = () => null
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = (control.value ?? '').toString().trim().toLowerCase();
    if (!valor) return null;

    const repetido = (items() ?? []).some(item =>
      item['id'] !== idActual() &&
      (item[campo] ?? '').toString().trim().toLowerCase() === valor
    );

    return repetido ? { repetido: true } : null;
  };
}
