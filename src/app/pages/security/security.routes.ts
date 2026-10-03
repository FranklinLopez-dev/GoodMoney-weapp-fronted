import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { RolesComponent } from './roles/roles.component';
import { RolesResolver } from './roles/roles.resolver';
import { AuditoriumsComponent } from './auditoriums/auditoriums.component';
import { AuditoriumsResolver } from './auditoriums/auditoriums.resolver';
import { UsersComponent } from './users/users.component';
import { UsersResolver } from './users/users.resolver';
import { ProfilesComponent } from './users/profiles/profiles.component';
import { ProfilesResolver } from './users/profiles/profiles.resolver';
import { ProfilesTablesResolver } from '../profiles/tables/profiles-tables.resolver';
import { ProfileDetailResolver } from './users/profiles/details/profiles-details.resolver';
import { ProfileDetailComponent } from './users/profiles/details/profiles-details.component';
import { BlackListComponent } from './black-list/black-list.component';
import { BlackListResolver } from './black-list/black-list.resolver';
import { AssignProfileComponent } from './assign-profiles/assign-profiles.component';
import { AssignProfilesResolver } from './assign-profiles/assing-profiles.resolver';

export const SecurityRoutes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'users' },
    {
        path: 'users',
        component: UsersComponent,
        data: {
            title: 'Usuarios',
            permission: Permission.UserIndex,
            urls: [
                { title: 'Seguridad', url: '/security' },
                { title: 'Usuarios' },
            ],
        },
        resolve: {
            preload: UsersResolver
        }
    },
    {
        path: 'black-list',
        component: BlackListComponent,
        data: {
            title: 'Lista negra',
            permission: Permission.UserIndex,
            urls: [
                { title: 'Seguridad', url: '/security' },
                { title: 'Lista negra' },
            ],
        },
        resolve: {
            preload: BlackListResolver
        }
    },
    {
        path: 'assign-profiles',
        component: AssignProfileComponent,
        data: {
            title: 'Asignar perfiles',
            permission: Permission.ProfileIndex,
            urls: [
                { title: 'Seguridad', url: '/security' },
                { title: 'Asignar perfiles' },
            ],
        },
        resolve: {
            preload: AssignProfilesResolver,
            profile: ProfilesTablesResolver
        }
    },
    {
        path: 'users/:userId',
        component: ProfilesComponent,
        data: {
            title: 'Perfiles',
            permission: Permission.ProfileIndex,
            urls: [
                { title: 'Usuarios', url: '/security/users' },
                { title: 'Perfiles' },
            ],
        },
        resolve: {
            preload: ProfilesResolver
        }
    },
    {
        path: 'users/:userId/:profileId',
        component: ProfileDetailComponent,
        data: {
            title: 'Perfil',
            permission: Permission.ProfileIndex
        },
        resolve: {
            tables: ProfilesTablesResolver,
            profile: ProfileDetailResolver
        }
    },
    {
        path: 'roles',
        component: RolesComponent,
        data: {
            title: 'Roles',
            permission: Permission.RolesIndex,
            urls: [
                { title: 'Seguridad', url: '/settings' },
                { title: 'Roles' },
            ],
        },
        resolve: {
            preload: RolesResolver
        }
    },
    {
        path: 'auditoriums',
        component: AuditoriumsComponent,
        data: {
            title: 'Auditoría',
            permission: Permission.AuditoriumsIndex,
            urls: [
                { title: 'Seguridad', url: '/security' },
                { title: 'Auditoría' },
            ],
        },
        resolve: {
            preload: AuditoriumsResolver
        }
    }
];
