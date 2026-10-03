import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function rangeValidator(
  fromKey: string,
  toKey: string,
  mode: 'date' | 'month' = 'date'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fromCtrl = group.get(fromKey);
    const toCtrl = group.get(toKey);

    if (!fromCtrl || !toCtrl) return null;

    const from = fromCtrl.value as Date | null;
    const to = toCtrl.value as Date | null;

    if (toCtrl.hasError('rangeInvalid')) {
      const errors = { ...toCtrl.errors };
      delete errors['rangeInvalid'];
      toCtrl.setErrors(Object.keys(errors).length ? errors : null);
    }

    if (!from || !to) return null;

    let isInvalid = false;

    if (mode === 'month') {
      const fromValue = from.getFullYear() * 12 + from.getMonth();
      const toValue = to.getFullYear() * 12 + to.getMonth();
      isInvalid = fromValue > toValue;
    } else {
      isInvalid = from.getTime() > to.getTime();
    }

    if (isInvalid) {
      const error = { rangeInvalid: true };
      toCtrl.setErrors({
        ...(toCtrl.errors ?? {}),
        ...error
      });
      return error;
    }

    return null;
  };
}
