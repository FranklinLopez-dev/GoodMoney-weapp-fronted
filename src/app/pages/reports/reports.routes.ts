import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { OperationsWebResolver } from '../operations/web/operations-web.resolver';
import { TraceabilityComponent } from './traceability/traceability.component';
import { ClientsComponent } from './clients/clients.component';
import { ClientsResolver } from './clients/clients.resolver';
import { SbsComponent } from './sbs/sbs.component';
import { SBSResolver } from './sbs/sbs.resolver';
import { ContabilityComponent } from './contability/contability.component';
import { ContabilityResolver } from './contability/contability.resolver';
import { BookClaimsResolver } from './book-claims/book-claims.resolver';
import { BookClaimsComponent } from './book-claims/book-claims.component';
import { AlertsReportComponent } from './alerts/alerts-report.component';
import { EmbudoComponent } from './embudo/embudo.component';

export const ReportsRoutes: Routes = [
    {
        path: 'embudo',
        component: EmbudoComponent,
        data: {
            title: 'Embudo del cambio en línea',
            permission: Permission.WebsIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Embudo' },
            ],
        },
    },
    {
        path: 'alertas',
        component: AlertsReportComponent,
        data: {
            title: 'Alertas de clientes',
            permission: Permission.AlertsReport,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Alertas de clientes' },
            ],
        },
    },
    {
        path: 'traceability',
        component: TraceabilityComponent,
        data: {
            title: 'Trazabilidad',
            permission: Permission.WebsIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Trazabilidad' },
            ],
        },
        resolve: {
            preload: OperationsWebResolver
        }
    },
    {
        path: 'clients',
        component: ClientsComponent,
        data: {
            title: 'Clientes',
            permission: Permission.UserIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Clientes' },
            ],
        },
        resolve: {
            preload: ClientsResolver
        }
    },
    {
        path: 'sbs',
        component: SbsComponent,
        data: {
            title: 'SBS',
            permission: Permission.WebsIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'SBS' },
            ],
        },
        resolve: {
            preload: SBSResolver
        }
    },
    {
        path: 'contability',
        component: ContabilityComponent,
        data: {
            title: 'Contabilidad',
            permission: Permission.WebsIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Contabilidad' },
            ],
        },
        resolve: {
            preload: ContabilityResolver
        }
    },
    {
        path: 'book-claims',
        component: BookClaimsComponent,
        data: {
            title: 'Libro de Reclamaciones',
            permission: Permission.BookclaimsIndex,
            urls: [
                { title: 'Reportes', url: '/reports' },
                { title: 'Libro de Reclamaciones' },
            ],
        },
        resolve: {
            preload: BookClaimsResolver
        }
    }
];
