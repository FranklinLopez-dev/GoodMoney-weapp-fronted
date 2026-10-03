import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { FiscalShellComponent } from './fiscal-shell.component';
import { FiscalComprobantesComponent } from './comprobantes/comprobantes.component';
import { FiscalPorFacturarComponent } from './por-facturar/por-facturar.component';
import { FiscalAnulacionesComponent } from './anulaciones/anulaciones.component';
import { FiscalResumenesComponent } from './resumenes/resumenes.component';
import { FiscalSireComponent } from './sire/sire.component';

const migas = (titulo: string) => [{ title: 'Gestión fiscal', url: '/fiscal' }, { title: titulo }];

export const FiscalRoutes: Routes = [
    {
        path: '',
        component: FiscalShellComponent,
        data: { title: 'Gestión fiscal', urls: [{ title: 'Gestión fiscal' }] },
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'comprobantes' },
            {
                path: 'comprobantes',
                component: FiscalComprobantesComponent,
                data: { title: 'Comprobantes electrónicos', permission: Permission.FiscalIndex, urls: migas('Comprobantes') },
            },
            {
                path: 'por-facturar',
                component: FiscalPorFacturarComponent,
                data: { title: 'Operaciones por facturar', permission: Permission.FiscalIndex, urls: migas('Por facturar') },
            },
            {
                path: 'anulaciones',
                component: FiscalAnulacionesComponent,
                data: { title: 'Anulaciones', permission: Permission.FiscalIndex, urls: migas('Anulaciones') },
            },
            {
                path: 'sire',
                component: FiscalSireComponent,
                data: { title: 'SIRE · Registro de Ventas', permission: Permission.SireIndex, urls: migas('SIRE') },
            },
            {
                path: 'resumenes',
                component: FiscalResumenesComponent,
                data: { title: 'Resúmenes y bajas', permission: Permission.FiscalIndex, urls: migas('Resúmenes y bajas') },
            },
        ],
    },
];
