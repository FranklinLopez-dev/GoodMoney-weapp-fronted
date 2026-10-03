import { Routes } from '@angular/router';
import { PersonsComponent } from './persons.component';
import { Permission } from 'src/app/core/auth/permissions.enum';

export const PersonsRoutes: Routes = [
    {
        path: '',
        component: PersonsComponent,
        data: {
            title: 'Personas',
            urls: [{ title: 'Personas' }],
            // Conciliar recorre la base entera y reescribe el modelo nuevo: pide `persons.manage`, y el API lo comprueba.
            permission: Permission.PersonsIndex,
        },
    },
];
