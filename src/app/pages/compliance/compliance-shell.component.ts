import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';

/** Antes era una pantalla con cinco pestañas: sin ruta propia no había enlace profundo ni botón atrás. */
@Component({
    selector: 'app-compliance-shell',
    standalone: true,
    imports: [CommonModule, MaterialModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './compliance-shell.component.html',
    styleUrls: ['./compliance-shell.component.scss'],
})
export class ComplianceShellComponent {

    private auth = inject(AuthStore);

    /** Además del guard: el guard impide entrar, esto impide enseñar una puerta que se cierra en la cara. */
    readonly pestanas = [
        { ruta: 'resumen', rotulo: 'Resumen', permiso: Permission.ComplianceIndex },
        { ruta: 'alertas', rotulo: 'Operaciones inusuales', permiso: Permission.ComplianceIndex },
        { ruta: 'registro', rotulo: 'Registro de Operaciones', permiso: Permission.ComplianceIndex },
        { ruta: 'operaciones-multiples', rotulo: 'Operaciones múltiples', permiso: Permission.ComplianceIndex },
        { ruta: 'revision-laft', rotulo: 'Revisión LAFT', permiso: Permission.ComplianceIndex },
        { ruta: 'iaoc', rotulo: 'Informe anual', permiso: Permission.ComplianceIndex },
        { ruta: 'listas', rotulo: 'Listas restrictivas', permiso: Permission.ComplianceIndex },
        { ruta: 'listas-propias', rotulo: 'Listas propias', permiso: Permission.ComplianceIndex },
        { ruta: 'exclusiones', rotulo: 'Exclusiones', permiso: Permission.ComplianceIndex },
        { ruta: 'expedientes', rotulo: 'Expedientes ROS', permiso: Permission.ComplianceRos },
        { ruta: 'configuracion', rotulo: 'Configuración', permiso: Permission.ComplianceSettings },
    ].filter(p => this.auth.hasPermission(p.permiso));
}
