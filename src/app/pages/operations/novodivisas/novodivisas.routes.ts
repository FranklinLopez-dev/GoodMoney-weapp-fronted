import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { NovodivisasComponent } from './novodivisas.component';
import { NovodivisasResolver } from './novodivisas.resolver';
import { ProfilesTablesResolver } from '../../profiles/tables/profiles-tables.resolver';

// Mismo motivo que operations-web.routes.ts: aisla `ProfilesTablesResolver`.
export const NovodivisasRoutes: Routes = [
    {
        path: '',
        component: NovodivisasComponent,
        data: {
            title: 'Novodivisas',
            permission: Permission.WebsIndex
        },
        resolve: {
            preload: NovodivisasResolver,
            profile: ProfilesTablesResolver
        }
    }
];
