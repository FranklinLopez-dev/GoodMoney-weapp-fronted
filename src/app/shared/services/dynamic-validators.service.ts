import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, ValidatorFn, Validators } from '@angular/forms';

export interface IDynamicValidatable {
  type?: 'text' | 'numeric';
  sizeMin?: number;
  sizeMax?: number;
  isRequired?: boolean;
  isNumeric?: boolean;
  isExact?: boolean;
  pattern?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class DynamicValidatorsService {

  numericValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const isNumeric = /^\d+$/.test(control.value);
      return isNumeric ? null : { numeric: true };
    };
  }

  exactLengthValidator(length: number): ValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      return control.value.length === length ? null : { exactLength: { requiredLength: length, actualLength: control.value.length } };
    };
  }

  buildValidators(item: IDynamicValidatable | null): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (!item) {
      return validators;
    }

    if (item?.isRequired !== false) {
      validators.push(Validators.required);
    }

    if (item?.sizeMin && item?.sizeMin > 0) {
      validators.push(Validators.minLength(item?.sizeMin));
    }

    if (item?.isExact && item?.sizeMin && item?.sizeMax && item?.sizeMin === item?.sizeMax) {
      validators.push(this.exactLengthValidator(item?.sizeMin));
    }

    if (item?.isNumeric) {
      validators.push(this.numericValidator());
    }

    if (item?.pattern) {
      validators.push(Validators.pattern(item?.pattern));
    }

    return validators;
  }

  applyValidators(
    control: FormControl | null,
    item: IDynamicValidatable | null
  ): void {
    if (!control) return;

    control.clearValidators();
    control.addValidators(this.buildValidators(item));
    control.updateValueAndValidity({ emitEvent: false });
  }

  applyValidatorsWithReset(
    control: FormControl | null,
    item: IDynamicValidatable | null
  ): void {
    if (!control) return;

    control.clearValidators();
    control.addValidators(this.buildValidators(item));
    control.reset();
    control.updateValueAndValidity();
  }

  getErrorMessage(
    control: AbstractControl | null,
    fieldName: string,
    item?: IDynamicValidatable
  ): string {
    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${fieldName} es obligatorio`;
    }

    if (errors['minlength']) {
      return `${fieldName} debe tener mínimo ${errors['minlength'].requiredLength} carácteres`;
    }

    if (errors['maxlength']) {
      return `${fieldName} debe tener máximo ${errors['maxlength'].requiredLength} carácteres`;
    }

    if (errors['exactLength']) {
      return `${fieldName} debe tener exactamente ${errors['exactLength'].requiredLength} carácteres`;
    }

    if (errors['numeric']) {
      return `${fieldName} solo puede contener números`;
    }

    if (errors['soloLetras']) {
      return `${fieldName} solo puede contener letras`;
    }

    if (errors['pattern']) {
      return `${fieldName} tiene un formato inválido`;
    }

    return 'Error de validación';
  }
}