import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable, finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Feriado, HolidaysService } from './holidays.service';
import { aFechaApi } from 'src/app/shared/utils/fechas';

/** Mandan sobre el horario semanal: un 28 de julio laborable deja de anunciarse abierto. */
@Component({
    selector: 'app-holidays',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, TablerIconsModule],
    templateUrl: './holidays.component.html',
    styleUrls: ['./holidays.component.scss'],
})
export class HolidaysComponent {

    private fb = inject(FormBuilder);
    private service = inject(HolidaysService);
    private toastr = inject(ToastrService);

    readonly anio = signal(new Date().getFullYear());
    readonly feriados = signal<Feriado[]>([]);
    readonly cargando = signal(false);
    readonly guardando = signal(false);
    readonly editando = signal<number | null>(null);

    /** Un par de años a cada lado: nadie planifica feriados más allá. */
    readonly anios = [-1, 0, 1, 2].map(d => new Date().getFullYear() + d);

    form = this.fb.group({
        date: [null as Date | null, [Validators.required, this.fechaRepetida()]],
        name: ['', Validators.required],
        isRecurring: [true],
    });

    /** Un día solo puede ser feriado una vez; al editar se excluye el propio registro. */
    private fechaRepetida(): ValidatorFn {
        return control => {
            if (!control.value) return null;
            const fecha = aFechaApi(new Date(control.value));
            const repetido = this.feriados().some(f =>
                f.id !== this.editando() && aFechaApi(new Date(f.date)) === fecha);
            return repetido ? { repetido: true } : null;
        };
    }

    constructor() {
        this.cargar();
    }

    cambiarAnio(anio: number): void {
        this.anio.set(anio);
        this.cancelar();
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.get(this.anio())
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe(res => this.feriados.set(res ?? []));
    }

    editar(f: Feriado): void {
        this.editando.set(f.id);
        this.form.patchValue({
            date: new Date(f.date),
            name: f.name,
            isRecurring: f.isRecurring,
        });
    }

    cancelar(): void {
        this.editando.set(null);
        this.form.reset({ isRecurring: true });
    }

    guardar(): void {
        if (this.form.invalid || this.guardando()) {
            this.form.markAllAsTouched();
            return;
        }

        this.guardando.set(true);

        const valores = this.form.getRawValue();
        const payload = {
            // Solo la fecha: la hora local del navegador podría desplazar el día al convertir a ISO.
            date: aFechaApi(valores.date!),
            name: valores.name!.trim(),
            isRecurring: !!valores.isRecurring,
        };

        // Tipado explícito: `update` devuelve void y `create` un Feriado, y la unión de ambas firmas no es invocable.
        const id = this.editando();
        const peticion: Observable<any> = id
            ? this.service.update(id, payload)
            : this.service.create(payload);

        peticion.pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success(id ? 'Feriado actualizado' : 'Feriado agregado', 'Listo');
                    this.cancelar();
                    this.cargar();
                },
                error: (err: any) => this.toastr.error(
                    typeof err?.error === 'string' ? err.error : 'No se pudo guardar el feriado'),
            });
    }

    eliminar(f: Feriado): void {
        this.service.delete(f.id).subscribe({
            next: () => {
                this.toastr.success('Feriado eliminado');
                this.cargar();
            },
            error: () => this.toastr.error('No se pudo eliminar el feriado'),
        });
    }
}
