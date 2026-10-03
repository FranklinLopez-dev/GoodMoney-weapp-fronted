import { Routes } from '@angular/router';
import { ProfilesComponent } from './pages/list/profiles.component';
import { ProfilesResolver } from './profiles.resolver';

export const ProfilesRoutes: Routes = [
    {
        path: '',
        component: ProfilesComponent,
        data: {
            title: 'Mis Perfiles',
            urls: [
                { title: 'Perfiles', url: '/profiles' },
                { title: 'Mis Perfiles' },
            ],
        },
        resolve: {
            preload: ProfilesResolver
        }
    },
    {
        // Va despues de `''` sin problema: una ruta vacia con `component` solo casa cuando la URL se consume entera.
        path: ':id',
        loadChildren: () =>
            import('./pages/details/profile-detail.routes').then((m) => m.ProfileDetailRoutes)
    }
];
