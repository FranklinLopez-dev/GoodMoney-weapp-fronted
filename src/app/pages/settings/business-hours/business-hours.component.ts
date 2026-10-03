import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { BusinessHoursService, DiaAtencion } from './business-hours.service';

const DIAS = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' },
    { valor: 0, nombre: 'Domingo' },
];

/** Estaba escrito a mano en el menú, en el pie del sitio público y en la página de empresas, y ya no coincidían. */
@Component({
    selector: 'app-business-hours',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, TablerIconsModule],
    templateUrl: './business-hours.component.html',
    styleUrls: ['./business-hours.component.scss'],
})
export class BusinessHoursComponent {

    private fb = inject(FormBuilder);
    private service = inject(BusinessHoursService);
    private toastr = inject(ToastrService);

    readonly dias = DIAS;
    readonly guardando = signal(false);
    readonly abierto = signal<boolean | null>(null);
    readonly lineas = signal<string[]>([]);

    form = this.fb.group({
        dias: this.fb.array(DIAS.map(d => this.fb.group({
            dayOfWeek: [d.valor],
            openTime: ['09:00'],
            closeTime: ['18:00'],
            isClosed: [false],
            note: [null as string | null],
        }))),
    });

    get filas(): FormArray {
        return this.form.get('dias') as FormArray;
    }

    constructor() {
        this.cargar();
    }

    nombreDe(indice: number): string {
        return DIAS[indice].nombre;
    }

    private cargar(): void {
        this.service.get().subscribe(res => {
            this.lineas.set(res.lines ?? []);
            this.abierto.set(res.openNow);

            // En el orden de la pantalla (lunes primero), no en el que llegue del servidor.
            DIAS.forEach((d, i) => {
                const dato = res.days?.find(x => x.dayOfWeek === d.valor);
                if (dato) this.filas.at(i).patchValue(dato);
            });
        });
    }

    guardar(): void {
        if (this.guardando()) return;

        this.guardando.set(true);
        const dias = this.filas.getRawValue() as DiaAtencion[];

        this.service.update(dias)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success('Horario actualizado', 'Listo');
                    // Se relee para que la vista previa muestre cómo queda redactado.
                    this.cargar();
                },
                error: err => this.toastr.error(
                    typeof err?.error === 'string' ? err.error : 'No se pudo guardar el horario'),
            });
    }
}
