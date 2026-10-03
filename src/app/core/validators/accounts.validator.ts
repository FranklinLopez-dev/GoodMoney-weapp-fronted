import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ProfileBanks } from '../models/profiles/profile-banks.model';

export function requiredPenAndUsdAccount(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const accounts = control.value as ProfileBanks[] | null;

    if (!accounts || accounts.length === 0) {
      return { accountsRequired: true };
    }

    const hasPen = accounts.some(a => a.coinId === 'PEN');
    const hasUsd = accounts.some(a => a.coinId === 'USD');

    if (!hasPen || !hasUsd) {
      return { missingCurrency: true };
    }

    return null;
  };
}