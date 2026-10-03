import { CanActivateFn, Router } from "@angular/router";
import { AuthStore } from "./auth.store";
import { inject } from "@angular/core";
import { Permission } from "./permissions.enum";

export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const permission = route.data?.['permission'] as Permission;

  if (!permission) return true;

  if (authStore.hasPermission(permission)) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
