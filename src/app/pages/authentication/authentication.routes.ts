import { Routes } from '@angular/router';

import { AuthLayoutComponent } from './layout/auth-layout.component';
import { LoginComponent } from './login/login.component';
import { VerifyEmailGuard } from './guards/verify-email.guard';
import { AuthCompanyResolver } from './auth-company.resolver';

// El login se queda estatico: es la vista de entrada y hacerla perezosa solo anade una peticion.
export const AuthenticationRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    resolve: {
      company: AuthCompanyResolver
    },
    children: [
      {
        path: 'login',
        data: {
          title: 'Iniciar sesión',
        },
        component: LoginComponent,
      },
      {
        path: 'register',
        data: {
          title: 'Registro',
        },
        loadChildren: () =>
          import('./register/register.routes').then((m) => m.RegisterRoutes),
      },
      {
        // Cierre del registro: el correo ya se verifico con el codigo del paso 1.
        path: 'account-created',
        data: {
          title: 'Cuenta creada',
        },
        loadComponent: () =>
          import('./account-created/account-created.component').then((m) => m.AccountCreatedComponent),
      },
      {
        path: 'verify-email',
        data: {
          title: 'Verificar cuenta',
        },
        canActivate: [VerifyEmailGuard],
        loadComponent: () =>
          import('./verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
      },
      {
        path: 'forgot-password',
        data: {
          title: 'Recuperar contraseña',
        },
        loadComponent: () =>
          import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        data: {
          title: 'Cambiar contraseña',
        },
        loadComponent: () =>
          import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
      },
      {
        // Cambio obligatorio para quien entra con la contrasena por defecto.
        path: 'change-password',
        data: {
          title: 'Cambiar contraseña',
        },
        loadComponent: () =>
          import('./change-password/change-password.component').then((m) => m.ChangePasswordComponent),
      },
      {
        path: 'confirm-account',
        data: {
          title: 'Confirmar cuenta',
        },
        loadComponent: () =>
          import('./confirm-account/confirm-account.component').then((m) => m.ConfirmAccountComponent),
      },
    ],
  },
];
