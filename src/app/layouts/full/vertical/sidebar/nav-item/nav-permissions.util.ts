import { AuthStore } from 'src/app/core/auth/auth.store';
import { NavItem } from './nav-item';

export function canShowNavItem(
  item: NavItem,
  auth: AuthStore
): boolean {

  if (item.permission) {
    return auth.hasPermission(item.permission);
  }

  if (item.permissionsAny?.length) {
    return item.permissionsAny.some(p => auth.hasPermission(p));
  }

  if (item.children?.length) {
    return item.children.some(child =>
      canShowNavItem(child, auth)
    );
  }

  return true;
}
