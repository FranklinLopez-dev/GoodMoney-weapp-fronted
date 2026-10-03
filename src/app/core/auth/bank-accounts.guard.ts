import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';

/** Cambiar exige cuenta en soles y en dólares; si faltan, manda a la pantalla de cuentas con `next`. */
export const bankAccountsGuard: CanActivateFn = (_route, state) => {
  const banks = inject(BanksAccountsService);
  const router = inject(Router);

  return banks.getAll().pipe(
    map(cuentas => {
      const activas = (cuentas ?? []).filter(c => c.status !== false);
      const tienePen = activas.some(c => c.coinId === 'PEN');
      const tieneUsd = activas.some(c => c.coinId === 'USD');

      if (tienePen && tieneUsd) return true;

      return router.createUrlTree(['/banks-accounts'], {
        queryParams: {
          next: state.url,
          falta: !tienePen && !tieneUsd ? 'ambas' : (tienePen ? 'USD' : 'PEN')
        }
      });
    }),
    // Si el API falla no se bloquea el paso: el backend revalida al registrar la operación.
    catchError(() => of(true))
  );
};
