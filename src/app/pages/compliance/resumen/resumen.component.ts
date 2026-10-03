import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceService, ResumenCumplimiento } from '../compliance.service';
import { claseEstado, mostrarError, nombreMes } from '../compliance-comunes';

/** Portada del módulo: la única pantalla que cruza alertas, registro, expedientes y la deuda del modelo de personas. */
@Component({
    selector: 'app-compliance-resumen',
    standalone: true,
    imports: [CommonModule, MaterialModule],
    templateUrl: './resumen.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceResumenComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);
    private router = inject(Router);
    private auth = inject(AuthStore);

    readonly puedeVerRos = this.auth.hasPermission(Permission.ComplianceRos);

    readonly resumen = signal<ResumenCumplimiento | null>(null);
    readonly cargando = signal(true);

    readonly claseEstado = claseEstado;
    readonly nombreMes = nombreMes;

    constructor() {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.resumen()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: r => this.resumen.set(r),
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo cargar el resumen.'),
            });
    }

    /** Va por la URL y no por un estado compartido para que el enlace se pueda copiar y mandar. */
    irAlMes(year: number, month: number): void {
        this.router.navigate(['/compliance/registro'], { queryParams: { anio: year, mes: month } });
    }
}
