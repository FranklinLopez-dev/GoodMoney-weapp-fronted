import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceShellComponent } from './compliance-shell.component';
import { ComplianceResumenComponent } from './resumen/resumen.component';
import { ComplianceAlertasComponent } from './alertas/alertas.component';
import { ComplianceRoComponent } from './ro/ro.component';
import { ComplianceRosComponent } from './ros/ros.component';
import { ComplianceExclusionesComponent } from './exclusiones/exclusiones.component';
import { ComplianceListasComponent } from './listas/listas.component';
import { ComplianceListasPropiasComponent } from './listas-propias/listas-propias.component';
import { ComplianceRevisionLaftComponent } from './revision-laft/revision-laft.component';
import { ComplianceIaocComponent } from './iaoc/iaoc.component';
import { ComplianceMultiplesComponent } from './multiples/multiples.component';
import { ComplianceConfiguracionComponent } from './configuracion/configuracion.component';

/** Cada hija lleva su permiso: con una sola ruta, esconder la pestaña de `ros` era cosmético. */
export const ComplianceRoutes: Routes = [
    {
        path: '',
        component: ComplianceShellComponent,
        data: { title: 'Cumplimiento', urls: [{ title: 'Cumplimiento' }] },
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'resumen' },
            {
                path: 'resumen',
                component: ComplianceResumenComponent,
                data: {
                    title: 'Cumplimiento',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento' }],
                },
            },
            {
                path: 'alertas',
                component: ComplianceAlertasComponent,
                data: {
                    title: 'Operaciones inusuales',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Operaciones inusuales' }],
                },
            },
            {
                path: 'registro',
                component: ComplianceRoComponent,
                data: {
                    title: 'Registro de Operaciones',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Registro de Operaciones' }],
                },
            },
            {
                path: 'operaciones-multiples',
                component: ComplianceMultiplesComponent,
                data: {
                    title: 'Operaciones múltiples',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Operaciones múltiples' }],
                },
            },
            {
                path: 'revision-laft',
                component: ComplianceRevisionLaftComponent,
                data: {
                    title: 'Revisión mensual LAFT',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Revisión mensual LAFT' }],
                },
            },
            {
                path: 'iaoc',
                component: ComplianceIaocComponent,
                data: {
                    title: 'Informe anual (IAOC)',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Informe anual (IAOC)' }],
                },
            },
            {
                path: 'listas',
                component: ComplianceListasComponent,
                data: {
                    title: 'Listas restrictivas',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Listas restrictivas' }],
                },
            },
            {
                path: 'listas-propias',
                component: ComplianceListasPropiasComponent,
                data: {
                    title: 'Listas propias',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Listas propias' }],
                },
            },
            {
                path: 'exclusiones',
                component: ComplianceExclusionesComponent,
                data: {
                    title: 'Exclusiones del registro',
                    permission: Permission.ComplianceIndex,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Exclusiones' }],
                },
            },
            {
                // Confidencial por deber de reserva, así que permiso propio comprobado por el guard.
                path: 'expedientes',
                component: ComplianceRosComponent,
                data: {
                    title: 'Expedientes ROS',
                    permission: Permission.ComplianceRos,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Expedientes ROS' }],
                },
            },
            {
                // Mover un umbral decide qué deja de aparecer en un registro que ve un regulador.
                path: 'configuracion',
                component: ComplianceConfiguracionComponent,
                data: {
                    title: 'Configuración de cumplimiento',
                    permission: Permission.ComplianceSettings,
                    urls: [{ title: 'Cumplimiento', url: '/compliance' }, { title: 'Configuración' }],
                },
            },
        ],
    },
];
