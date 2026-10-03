import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { MaterialModule } from 'src/app/material.module';
import { environment } from 'src/environments/environment';

interface EstadoPublicacion {
    activo: boolean;
    correo: string | null;
    tieneClave: boolean;
    tieneToken: boolean;
    tokenVence: string | null;
    ultimoEnvioAt: string | null;
    ultimoOk: boolean | null;
    ultimoResultado: string | null;
    ultimaCompra: number | null;
    ultimaVenta: number | null;
    /** Este servidor publica (lo habilita su configuración; en desarrollo, no). */
    habilitado: boolean;
}

/**
 * Publicación del tipo de cambio en cuantoestaeldolar.pe. Tiene su propio guardado (no va con el resto de
 * la configuración): la clave de la cuenta del portal se manda solo si se escribe una nueva y nunca vuelve.
 */
@Component({
    selector: 'app-publicacion-tipo-cambio',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule],
    templateUrl: './publicacion-tipo-cambio.component.html',
    styleUrls: ['./system-settings.component.scss'],
})
export class PublicacionTipoCambioComponent {

    private http = inject(HttpClient);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);
    private baseUrl = `${environment.apiUrl}/api/publicacion/cuantoestaeldolar`;

    readonly puedeEditar = this.auth.hasPermission(Permission.SettingsUpdate);
    readonly estado = signal<EstadoPublicacion | null>(null);
    readonly activo = signal(false);
    readonly correo = signal('');
    readonly clave = signal('');
    readonly ocupado = signal<'guardar' | 'probar' | 'publicar' | null>(null);

    constructor() { this.cargar(); }

    cargar(): void {
        this.http.get<EstadoPublicacion>(this.baseUrl).subscribe({
            next: e => {
                this.estado.set(e);
                this.activo.set(e.activo);
                this.correo.set(e.correo ?? '');
                this.clave.set('');
            },
            error: () => this.estado.set(null),
        });
    }

    guardar(): void {
        this.ocupado.set('guardar');
        this.http.put(this.baseUrl, { activo: this.activo(), correo: this.correo().trim(), clave: this.clave() || null })
            .pipe(finalize(() => this.ocupado.set(null)))
            .subscribe({
                next: () => { this.toastr.success('Configuración de publicación guardada.'); this.cargar(); },
                error: (e: HttpErrorResponse) => this.error(e, 'No se pudo guardar.'),
            });
    }

    probar(): void {
        this.ocupado.set('probar');
        this.http.post<{ mensaje: string }>(`${this.baseUrl}/probar`, {})
            .pipe(finalize(() => { this.ocupado.set(null); this.cargar(); }))
            .subscribe({
                next: r => {
                    this.toastr.success(r.mensaje);
                    if (this.estado()?.activo) setTimeout(() => this.cargar(), 32000);
                },
                error: (e: HttpErrorResponse) => this.error(e, 'No se pudo probar el acceso.'),
            });
    }

    publicar(): void {
        this.ocupado.set('publicar');
        this.http.post<{ mensaje: string; esperaSegundos: number | null }>(`${this.baseUrl}/publicar`, {})
            .pipe(finalize(() => { this.ocupado.set(null); this.cargar(); }))
            .subscribe({
                next: r => {
                    this.toastr.success(r.mensaje);
                    // Quedó programada: se vuelve a leer cuando ya debió salir, para no quedarse en "en unos segundos".
                    if (r.esperaSegundos) setTimeout(() => this.cargar(), (r.esperaSegundos + 5) * 1000);
                },
                error: (e: HttpErrorResponse) => this.error(e, 'No se pudo publicar.'),
            });
    }

    private error(e: HttpErrorResponse, porDefecto: string): void {
        this.toastr.error(typeof e.error === 'string' && e.error.trim() ? e.error : porDefecto);
    }
}
