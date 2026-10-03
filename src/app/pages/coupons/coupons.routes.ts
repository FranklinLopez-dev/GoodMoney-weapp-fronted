import { Routes } from '@angular/router';
import { CouponsResolver } from './coupons.resolver';
import { CouponsComponent } from './coupons.component';
import { QuotePreviewStore } from './quote-preview/quote-preview.store';
import { QuotePreviewResolver } from './quote-preview/quote-preview.resolver';

export const CouponsRoutes: Routes = [
    {
        path: '',
        component: CouponsComponent,
        providers: [QuotePreviewStore, QuotePreviewResolver],
        data: {
            // La banda amarilla (frame 453) se pinta solo si la ruta trae `urls`; sin ellas esta vista empezaba en blanco.
            title: 'Beneficios',
            urls: [
                { title: 'Beneficios' },
            ],
        },
        resolve: {
            preload: CouponsResolver,
            operation: QuotePreviewResolver
        }
    }
];
