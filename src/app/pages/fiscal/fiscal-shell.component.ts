import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';

/** Gestión fiscal: una ruta por pestaña, para enlace directo y botón atrás (igual que Cumplimiento). */
@Component({
    selector: 'app-fiscal-shell',
    standalone: true,
    imports: [CommonModule, MaterialModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
<mat-card>
  <mat-card-content>
    <nav class="cmp-nav">
      @for (p of pestanas; track p.ruta) {
      <a class="cmp-nav__enlace" [routerLink]="p.ruta" routerLinkActive="cmp-nav__enlace--activo">{{ p.rotulo }}</a>
      }
    </nav>
    <router-outlet></router-outlet>
  </mat-card-content>
</mat-card>`,
    styleUrls: ['../compliance/compliance-shell.component.scss'],
})
export class FiscalShellComponent {
    private auth = inject(AuthStore);

    readonly pestanas = [
        { ruta: 'comprobantes', rotulo: 'Comprobantes', permiso: Permission.FiscalIndex },
        { ruta: 'por-facturar', rotulo: 'Por facturar', permiso: Permission.FiscalIndex },
        { ruta: 'anulaciones', rotulo: 'Anulaciones', permiso: Permission.FiscalIndex },
        { ruta: 'resumenes', rotulo: 'Resúmenes y bajas', permiso: Permission.FiscalIndex },
        { ruta: 'sire', rotulo: 'SIRE', permiso: Permission.SireIndex },
    ].filter(p => this.auth.hasPermission(p.permiso));
}
