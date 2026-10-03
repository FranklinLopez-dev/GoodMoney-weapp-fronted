import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { ComplianceService, ConfiguracionCumplimiento } from '../compliance.service';
import { mostrarError } from '../compliance-comunes';

/** Umbrales de lo que se reporta a la UIF; con permiso propio, porque moverlos cambia lo que ve un regulador. */
@Component({
    selector: 'app-compliance-configuracion',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './configuracion.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceConfiguracionComponent {

    private service = inject(ComplianceService);
    private toastr = inject(ToastrService);

    readonly configuracion = signal<ConfiguracionCumplimiento | null>(null);
    readonly cargando = signal(false);
    readonly guardando = signal(false);

    constructor() {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.configuracion()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: c => this.configuracion.set(c),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudo cargar la configuración.'),
            });
    }

    guardar(): void {
        const c = this.configuracion();
        if (!c) return;

        this.guardando.set(true);
        this.service.guardarConfiguracion(c)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => this.toastr.success('Configuración guardada.'),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudo guardar la configuración.'),
            });
    }

    /** Edita un campo sin perder el resto del objeto. */
    fijar<K extends keyof ConfiguracionCumplimiento>(campo: K, valor: ConfiguracionCumplimiento[K]): void {
        const c = this.configuracion();
        if (c) this.configuracion.set({ ...c, [campo]: valor });
    }
}
