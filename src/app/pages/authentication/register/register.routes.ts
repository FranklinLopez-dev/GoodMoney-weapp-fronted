import { Routes } from '@angular/router';
import { RegisterComponent } from './register.component';
import { RegisterResolver } from './register.resolver';

// Aparte para que `RegisterResolver` —y countries.json, 140 KB— no acabe en el chunk del login.
export const RegisterRoutes: Routes = [
    {
        path: '',
        component: RegisterComponent,
        data: {
            title: 'Registro',
        },
        resolve: {
            preload: RegisterResolver
        }
    }
];
