import { Routes } from '@angular/router';
import { NotificationsComponent } from './notifications.component';
import { NotificationsResolver } from './notifications.resolver';

export const NotificationsRoutes: Routes = [
    {
        path: '',
        component: NotificationsComponent,
        data: {
            title: 'Notificaciones',
        },
        resolve: {
           preload: NotificationsResolver
        }
    }
];
