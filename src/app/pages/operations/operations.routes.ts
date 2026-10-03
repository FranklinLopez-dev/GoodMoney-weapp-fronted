import { Routes } from '@angular/router';
import { bankAccountsGuard } from 'src/app/core/auth/bank-accounts.guard';
import { CreateOperationComponent } from './create/create-operation.component';
import { CreateOperationResolver } from './create/create-operation.resolver';
import { OperationCreateStore } from './create/store/operation-create.store';
import { OperationsResolver } from './list/operations-list.resolver';

// `''` usa loadComponent y no loadChildren: asi la ruta vacia solo casa cuando la URL se consume entera.
export const OperationsRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./list/operations-list.component').then((m) => m.OperationsComponent),
        data: {
            title: 'Mis operaciones',
            urls: [
                { title: 'Operaciones', url: '/operations' },
                { title: 'Mis operaciones' },
            ],
        },
        resolve: {
            preload: OperationsResolver
        }
    },
    {
        path: 'create',
        component: CreateOperationComponent,
        // Sin cuenta en soles y otra en dolares no se puede depositar: se piden aqui, no en el registro.
        canActivate: [bankAccountsGuard],
        providers: [OperationCreateStore, CreateOperationResolver],
        data: {
            title: 'Cambiar dólares',
            // Sin `urls` a proposito: la franja amarilla ya dice en que paso estas y las migas enlazaban a /profiles.
        },
        resolve: {
            preload: CreateOperationResolver
        }
    },
    {
        path: 'web',
        loadChildren: () =>
            import('./web/operations-web.routes').then((m) => m.OperationsWebRoutes)
    },
    {
        path: 'novodivisas',
        loadChildren: () =>
            import('./novodivisas/novodivisas.routes').then((m) => m.NovodivisasRoutes)
    }
];
