import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { OperationsWebComponent } from './operations-web.component';
import { OperationsWebResolver } from './operations-web.resolver';
import { ProfilesTablesResolver } from '../../profiles/tables/profiles-tables.resolver';

// Aparte para que `ProfilesTablesResolver` —y el countries.json de 140 KB— no viaje al crear operacion.
export const OperationsWebRoutes: Routes = [
    {
        path: '',
        component: OperationsWebComponent,
        data: {
            title: 'Operaciones web',
            permission: Permission.WebsIndex,
            urls: [
                { title: 'Operaciones', url: '/operations/web' },
                { title: 'Operaciones web' },
            ],
        },
        resolve: {
            preload: OperationsWebResolver,
            profile: ProfilesTablesResolver
        }
    }
];
