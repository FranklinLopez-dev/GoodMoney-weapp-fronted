import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { QuotePreviewStore } from '../coupons/quote-preview/quote-preview.store';
import { QuotePreviewResolver } from '../coupons/quote-preview/quote-preview.resolver';
import { DashboardStore } from './store/dashboard.store';
import { DashboardResolver } from './home.resolver';

export const HomeRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    providers: [DashboardStore, DashboardResolver, QuotePreviewStore, QuotePreviewResolver],
    data: {
      permission: Permission.DashboardIndex,
      // Banda amarilla de cabecera (frame 440): era la única vista que empezaba directamente con contenido.
      title: 'Inicio',
      urls: [
        { title: 'Inicio' },
      ],
    },
    resolve: {
      dashboard: DashboardResolver
    }
  },
];
