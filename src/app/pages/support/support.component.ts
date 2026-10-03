import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import {
    Cola, EnvioSaliente, EnvioSalienteDetalle, FilaRegistro, SupportService,
} from './support.service';

/** La pantalla para el "no me llegó nada": Hangfire se purga y el log solo vivía en la consola del IIS. */
@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule],
    templateUrl: './support.component.html',
    styleUrls: ['./support.component.scss'],
})
export class SupportComponent {

    private service = inject(SupportService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);

    readonly puedeGestionar = this.auth.hasPermission(Permission.SupportManage);

    // salientes
    readonly envios = signal<EnvioSaliente[]>([]);
    readonly total = signal(0);
    readonly pagina = signal(1);
    readonly tamano = 25;
    readonly cargandoEnvios = signal(true);
    readonly canal = signal('');
    readonly estado = signal('');
    readonly busqueda = signal('');

    readonly detalle = signal<EnvioSalienteDetalle | null>(null);
    readonly cargandoDetalle = signal(false);
    readonly reintentando = signal(false);

    // cola
    readonly cola = signal<Cola | null>(null);
    readonly cargandoCola = signal(false);

    // registro
    readonly registro = signal<FilaRegistro[]>([]);
    readonly totalRegistro = signal(0);
    readonly paginaRegistro = signal(1);
    readonly sinTablaRegistro = signal(false);
    readonly cargandoRegistro = signal(false);
    readonly nivel = signal('');
    readonly busquedaRegistro = signal('');

    constructor() {
        toObservable(this.busqueda)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargarEnvios());

        toObservable(this.busquedaRegistro)
            .pipe(skip(1), conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargarRegistro());

        this.cargarEnvios();
    }

    // salientes

    cargarEnvios(pagina = 1): void {
        this.pagina.set(pagina);
        this.cargandoEnvios.set(true);
        this.service.envios({
            channel: this.canal(), status: this.estado(), search: this.busqueda(),
            page: pagina, pageSize: this.tamano,
        })
            .pipe(finalize(() => this.cargandoEnvios.set(false)))
            .subscribe({
                next: r => { this.envios.set(r.items ?? []); this.total.set(r.total ?? 0); },
                error: () => this.toastr.error('No se pudo cargar la bitácora'),
            });
    }

    limpiarFiltros(): void {
        this.canal.set(''); this.estado.set(''); this.busqueda.set('');
        this.cargarEnvios();
    }

    verDetalle(id: number): void {
        this.cargandoDetalle.set(true);
        this.detalle.set(null);
        this.service.envio(id)
            .pipe(finalize(() => this.cargandoDetalle.set(false)))
            .subscribe({
                next: d => this.detalle.set(d),
                error: () => this.toastr.error('No se pudo cargar el envío'),
            });
    }

    cerrarDetalle(): void { this.detalle.set(null); }

    reintentar(id: number): void {
        if (this.reintentando()) return;
        this.reintentando.set(true);
        this.service.reintentar(id)
            .pipe(finalize(() => this.reintentando.set(false)))
            .subscribe({
                next: r => {
                    if (r.enviado) this.toastr.success('Se volvió a enviar', 'Listo');
                    else this.toastr.warning(r.motivo ?? 'No salió', 'Sin enviar');
                    this.cerrarDetalle();
                    this.cargarEnvios(this.pagina());
                },
                error: (e: HttpErrorResponse) =>
                    this.toastr.error(typeof e.error === 'string' ? e.error : 'No se pudo reintentar'),
            });
    }

    /** Verde solo lo entregado; "Omitido" es gris, no rojo. Ver el resumen. */
    claseEstado(estado: string): string {
        if (estado === 'Enviado') return 'sop-chip--ok';
        if (estado === 'Fallido') return 'sop-chip--mal';
        return 'sop-chip--neutro';
    }

    get paginas(): number { return Math.max(1, Math.ceil(this.total() / this.tamano)); }

    // cola

    cargarCola(): void {
        this.cargandoCola.set(true);
        this.service.cola()
            .pipe(finalize(() => this.cargandoCola.set(false)))
            .subscribe({
                next: c => this.cola.set(c),
                error: () => this.toastr.error('No se pudo cargar la cola'),
            });
    }

    borrarTrabajo(jobId: string): void {
        if (!confirm('¿Borrar este trabajo de la cola? No se puede recuperar.')) return;
        this.service.borrarTrabajo(jobId).subscribe({
            next: () => { this.toastr.success('Trabajo borrado'); this.cargarCola(); },
            error: () => this.toastr.error('No se pudo borrar'),
        });
    }

    purgar(): void {
        // Sin empresas que filtrar esto se lleva la cola entera —encolados, programados y fallidos— y no hay vuelta atrás.
        if (!confirm('Esto borra TODA la cola: encolados, programados y fallidos. ¿Seguir?')) return;
        if (!confirm('No se puede deshacer. ¿Confirmas que quieres vaciar la cola?')) return;

        this.service.purgarCola().subscribe({
            next: r => { this.toastr.success(`${r.borrados} trabajos borrados`); this.cargarCola(); },
            error: () => this.toastr.error('No se pudo purgar la cola'),
        });
    }

    // registro

    cargarRegistro(pagina = 1): void {
        this.paginaRegistro.set(pagina);
        this.cargandoRegistro.set(true);
        this.service.registro(this.nivel(), this.busquedaRegistro(), pagina, this.tamano)
            .pipe(finalize(() => this.cargandoRegistro.set(false)))
            .subscribe({
                next: r => {
                    this.registro.set(r.items ?? []);
                    this.totalRegistro.set(r.total ?? 0);
                    this.sinTablaRegistro.set(!!r.sinTabla);
                },
                error: () => this.toastr.error('No se pudo cargar el registro'),
            });
    }

    get paginasRegistro(): number { return Math.max(1, Math.ceil(this.totalRegistro() / this.tamano)); }

    claseNivel(nivel: string): string {
        if (nivel === 'Error' || nivel === 'Fatal') return 'sop-chip--mal';
        if (nivel === 'Warning') return 'sop-chip--aviso';
        return 'sop-chip--neutro';
    }

    /** La pestaña carga al abrirse, no al entrar a la pantalla. */
    alCambiarPestana(indice: number): void {
        if (indice === 1 && !this.cola()) this.cargarCola();
        if (indice === 2 && !this.registro().length && !this.sinTablaRegistro()) this.cargarRegistro();
    }
}
