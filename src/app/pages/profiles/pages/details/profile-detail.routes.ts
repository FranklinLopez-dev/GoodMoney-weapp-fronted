import { Routes } from '@angular/router';
import { ProfilesTablesResolver } from '../../tables/profiles-tables.resolver';
import { ProfileDetailResolver } from './profile-detail.resolver';
import { ProfileDetailComponent } from './profile-detail.component';

// Aparte para que `ProfilesTablesResolver` (y el countries.json que arrastra) no viaje con el listado.
export const ProfileDetailRoutes: Routes = [
    {
        path: '',
        component: ProfileDetailComponent,
        data: {
            title: 'Perfil',
            urls: [
                { title: 'Perfiles', url: '/profiles' },
                { title: 'Perfil' },
            ],
        },
        resolve: {
            tables: ProfilesTablesResolver,
            profile: ProfileDetailResolver
        }
    }
];
