import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthStore } from "./auth.store";

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    router.navigate(['/authentication/login']);
    return false;
  }

  // El backend lo bloquea igual con 403; esto solo evita mostrarle pantallas vacias.
  if (authStore.mustChangePassword()) {
    router.navigate(['/authentication/change-password']);
    return false;
  }

  return true;
};
