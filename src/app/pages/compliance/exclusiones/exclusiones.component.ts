import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ComplianceService, Exclusion } from '../compliance.service';
import { PersonaListado, PersonsService } from '../../persons/persons.service';
import { mostrarError } from '../compliance-comunes';

/** Se excluye por persona y no por documento (el DNI `00000000` son 411 personas); el motivo sustenta ante la SBS. */
@Component({
    selector: 'app-compliance-exclusiones',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './exclusiones.component.html',
    styleUrls: ['../_compartido.scss'],
})
export class ComplianceExclusionesComponent {

    private service = inject(ComplianceService);
    private personas = inject(PersonsService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeRevisar = this.auth.hasPermission(Permission.ComplianceReview);

    readonly exclusiones = signal<Exclusion[]>([]);
    readonly cargando = signal(false);
    readonly verInactivas = signal(false);

    // alta
    readonly buscando = signal(false);
    readonly busquedaPersona = signal('');
    readonly candidatas = signal<PersonaListado[]>([]);
    readonly elegida = signal<PersonaListado | null>(null);
    readonly motivo = signal('');
    readonly tipo = signal('Personal');
    readonly guardando = signal(false);

    constructor() {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.service.exclusiones(this.verInactivas() ? undefined : true)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: x => this.exclusiones.set(x ?? []),
                error: (e: HttpErrorResponse) =>
                    mostrarError(this.toastr, e, 'No se pudieron cargar las exclusiones.'),
            });
    }

    buscarPersona(): void {
        const valor = this.busquedaPersona().trim();
        if (valor.length < 3) {
            this.toastr.info('Escribe al menos tres caracteres del documento o del nombre.');
            return;
        }

        this.buscando.set(true);
        this.personas.listado({ valor, page: 0, recordsByPage: 10 })
            .pipe(finalize(() => this.buscando.set(false)))
            .subscribe({
                next: r => {
                    this.candidatas.set(r.body ?? []);
                    if (!r.body?.length) this.toastr.info('Ninguna persona coincide con esa búsqueda.');
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo buscar.'),
            });
    }

    elegir(p: PersonaListado): void {
        this.elegida.set(p);
        this.candidatas.set([]);
        this.busquedaPersona.set('');
    }

    cancelar(): void {
        this.elegida.set(null);
        this.motivo.set('');
        this.tipo.set('Personal');
    }

    excluir(): void {
        const persona = this.elegida();
        if (!persona) return;

        if (!this.motivo().trim()) {
            this.toastr.error('Escribe por qué se excluye a esta persona.');
            return;
        }

        this.guardando.set(true);
        this.service.excluir({ personId: persona.id, reason: this.motivo().trim(), type: this.tipo() })
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.toastr.success('Persona excluida del Registro de Operaciones.');
                    this.cancelar();
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo excluir.'),
            });
    }

    desactivar(x: Exclusion): void {
        if (!confirm(`¿Devolver a ${x.fullName || x.documentNumber} al Registro de Operaciones? ` +
                     `Sus operaciones volverán a salir en los meses que no se hayan remitido.`)) return;

        this.service.desactivarExclusion(x.id).subscribe({
            next: () => { this.toastr.success('Exclusión desactivada.'); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarError(this.toastr, e, 'No se pudo desactivar.'),
        });
    }
}
