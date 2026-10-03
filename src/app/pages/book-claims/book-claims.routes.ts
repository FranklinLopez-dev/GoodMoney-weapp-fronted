import { Routes } from '@angular/router';
import { OperationCreateStore } from '../operations/create/store/operation-create.store';
import { BookClaimsClientComponent } from './book-claims.component';
import { BookClaimsClientResolver } from './book-claims.resolver';

export const BookClaimsRoutes: Routes = [
    {
        path: '',
        component: BookClaimsClientComponent,
        data: {
            title: 'Mis Reclamos',
            urls: [
                { title: 'Libro de reclamaciones', url: '/book-claims' },
                { title: 'Mis Reclamos' },
            ],
        },
        resolve: {
            preload: BookClaimsClientResolver
        }
    }
];
