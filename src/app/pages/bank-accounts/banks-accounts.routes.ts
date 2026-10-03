import { Routes } from '@angular/router';
import { OperationCreateStore } from '../operations/create/store/operation-create.store';
import { BanksAccountsResolver } from './banks-accounts.resolver';
import { BanksAccountsComponent } from './list/banks-accounts-list.component';


export const BanksAccountsRoutes: Routes = [
    {
        path: '',
        component: BanksAccountsComponent,
        providers: [OperationCreateStore, BanksAccountsResolver],
        data: {
            title: 'Mis Cuentas Bancarias',
            urls: [
                { title: 'Cuentas Bancarias', url: '/banks-accounts' },
                { title: 'Mis Cuentas Bancarias' },
            ],
        },
        resolve: {
            preload: BanksAccountsResolver
        }
    }
];
