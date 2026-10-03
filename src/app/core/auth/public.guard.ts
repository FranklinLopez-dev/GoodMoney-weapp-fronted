import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthStore } from "./auth.store";

export const publicGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
