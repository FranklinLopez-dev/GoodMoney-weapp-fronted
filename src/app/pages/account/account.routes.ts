import { Routes } from '@angular/router';
import { AccountSecurityComponent } from './security/account-security.component';
import { AccountNotificationsComponent } from './notifications/account-notifications.component';
import { AccountExchangeAlertComponent } from './exchange-alert/account-exchange-alert.component';

/** "Mi cuenta": sin permisos a propósito. `/security` es el backoffice; esto lo ve cualquiera que entre. */
export const AccountRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'security' },
    {
        path: 'security',
        component: AccountSecurityComponent,
        data: {
            title: 'Seguridad de mi cuenta',
            urls: [
                { title: 'Mi cuenta' },
                { title: 'Seguridad' },
            ],
        },
    },
    {
        path: 'notifications',
        component: AccountNotificationsComponent,
        data: {
            title: 'Mis avisos',
            urls: [
                { title: 'Mi cuenta' },
                { title: 'Avisos' },
            ],
        },
    },
    {
        path: 'exchange-alert',
        component: AccountExchangeAlertComponent,
        data: {
            title: 'Alerta de tipo de cambio',
            urls: [
                { title: 'Mi cuenta' },
                { title: 'Alerta de tipo de cambio' },
            ],
        },
    },
];
