import { ResolveFn, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/public.guard';
import { UtilsService } from './core/services/common/utils.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { permissionGuard } from './core/auth/permission.guard';
import { NotificationsService } from './pages/notifications/notifications.service';
import { SocketService } from './services/socket.service';
import { SocketProfileService } from './services/socket-profile.service';

export const initialDataResolver: ResolveFn<boolean> = async () => {
  const appData = inject(UtilsService);
  
  if (appData.loaded()) {
    return true;
  }

  await firstValueFrom(appData.getDataInitial());

  return true;
};

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    resolve: {
      init: initialDataResolver,
      notifications: () => inject(NotificationsService).requestPermission(),
      socket: () => inject(SocketService).start(),
      socketProfile: () => inject(SocketProfileService).init(),
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'operations/create' },
      {
        path: 'home',
        data: {
          title: 'Inicio',
        },
        loadChildren: () =>
          import('./pages/home/home.routes').then(
            (m) => m.HomeRoutes
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings.routes').then(
            (m) => m.SettingsRoutes
          ),
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./pages/security/security.routes').then(
            (m) => m.SecurityRoutes
          ),
      },
      {
        path: 'support',
        loadChildren: () =>
          import('./pages/support/support.routes').then(
            (m) => m.SupportRoutes
          ),
      },
      {
        path: 'fiscal',
        loadChildren: () =>
          import('./pages/fiscal/fiscal.routes').then(
            (m) => m.FiscalRoutes
          ),
      },
      {
        path: 'compliance',
        loadChildren: () =>
          import('./pages/compliance/compliance.routes').then(
            (m) => m.ComplianceRoutes
          ),
      },
      {
        path: 'persons',
        loadChildren: () =>
          import('./pages/persons/persons.routes').then(
            (m) => m.PersonsRoutes
          ),
      },
      // Mi cuenta: lo que cada usuario administra de sí mismo; 'security' es el backoffice y lleva permisos.
      {
        path: 'account',
        loadChildren: () =>
          import('./pages/account/account.routes').then(
            (m) => m.AccountRoutes
          ),
      },
      {
        path: 'profiles',
        loadChildren: () =>
          import('./pages/profiles/profiles.routes').then(
            (m) => m.ProfilesRoutes
          ),
      },
      {
        path: 'banks-accounts',
        loadChildren: () =>
          import('./pages/bank-accounts/banks-accounts.routes').then(
            (m) => m.BanksAccountsRoutes
          ),
      },
      {
        path: 'book-claims',
        loadChildren: () =>
          import('./pages/book-claims/book-claims.routes').then(
            (m) => m.BookClaimsRoutes
          ),
      },
      {
        path: 'operations',
        loadChildren: () =>
          import('./pages/operations/operations.routes').then(
            (m) => m.OperationsRoutes
          ),
      },
      {
        path: 'coupons',
        loadChildren: () =>
          import('./pages/coupons/coupons.routes').then(
            (m) => m.CouponsRoutes
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./pages/reports/reports.routes').then(
            (m) => m.ReportsRoutes
          ),
      },
      {
        path: 'chats',
        loadChildren: () =>
          import('./pages/chats/chats.routes').then(
            (m) => m.ChatsRoutes
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./pages/notifications/notifications.routes').then(
            (m) => m.NotificationsRoutes
          ),
      },
    ],
  },
  {
    // Firma de la declaración jurada por enlace: pública (el token del correo es la credencial), sin el
    // publicGuard, que manda a /home a quien tenga sesión abierta. El token va en el fragmento (#): así no
    // llega a ningún servidor, registro ni a la analítica (que manda la ruta).
    path: 'firma-dj',
    component: BlankComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/firma-dj/firma-dj.component').then(m => m.FirmaDjComponent),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    canActivate: [publicGuard],
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: '**',
        redirectTo: 'authentication/login',
      },
    ],
  },
];
