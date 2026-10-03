import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import {
    NotificationPreference,
    NotificationPreferenceGroup,
    NotificationPreferencesService,
} from '../notification-preferences.service';

/** Se pinta con lo que manda el API: aquí no hay ninguna lista escrita a mano. El equipo ve dos bloques. */
@Component({
    selector: 'app-account-notifications',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule],
    templateUrl: './account-notifications.component.html',
    styleUrls: ['./account-notifications.component.scss'],
})
export class AccountNotificationsComponent {

    private service = inject(NotificationPreferencesService);
    private toastr = inject(ToastrService);

    readonly cargando = signal(true);
    readonly guardando = signal(false);
    readonly grupos = signal<NotificationPreferenceGroup[]>([]);

    /** Lo guardado en el servidor, para saber si de verdad cambió algo. */
    private original = '';

    readonly hayCambios = computed(() =>
        JSON.stringify(this.grupos()) !== this.original);

    /** Si ningún aviso del bloque tiene correo, la columna sobra entera. */
    tieneColumnaCorreo(grupo: NotificationPreferenceGroup): boolean {
        return grupo.preferences.some(p => p.hasEmail);
    }

    /** Si el canal está apagado en la configuración del sistema, `hasWhatsApp` llega en false y no se pinta. */
    tieneColumnaWhatsApp(grupo: NotificationPreferenceGroup): boolean {
        return grupo.preferences.some(p => p.hasWhatsApp);
    }

    constructor() {
        this.service.get()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: res => {
                    this.grupos.set(res?.groups ?? []);
                    this.original = JSON.stringify(this.grupos());
                },
                error: () => this.toastr.error('No se pudieron cargar tus preferencias'),
            });
    }

    alternar(tipo: string, canal: 'inApp' | 'email' | 'whatsApp', valor: boolean): void {
        this.grupos.update(grupos => grupos.map(g => ({
            ...g,
            preferences: g.preferences.map(p =>
                p.type === tipo ? { ...p, [canal]: valor } : p),
        })));
    }

    /** Enciende o apaga todo un bloque de una vez. */
    alternarBloque(audiencia: string, valor: boolean): void {
        this.grupos.update(grupos => grupos.map(g => g.audience !== audiencia ? g : ({
            ...g,
            // De los obligatorios solo se toca WhatsApp, que es el único canal negociable.
            preferences: g.preferences.map(p => p.mandatory
                ? ({ ...p, whatsApp: p.hasWhatsApp ? valor : p.whatsApp })
                : ({
                    ...p,
                    inApp: p.hasInApp ? valor : p.inApp,
                    email: p.hasEmail ? valor : p.email,
                    whatsApp: p.hasWhatsApp ? valor : p.whatsApp,
                })),
        })));
    }

    guardar(): void {
        if (this.guardando() || !this.hayCambios()) return;

        this.guardando.set(true);

        // Los obligatorios sí se mandan si admiten WhatsApp: su panel y su correo los fuerza el servidor.
        const aGuardar: NotificationPreference[] = this.grupos()
            .flatMap(g => g.preferences)
            .filter(p => !p.mandatory || p.hasWhatsApp);

        this.service.save(aGuardar)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.original = JSON.stringify(this.grupos());
                    this.toastr.success('Preferencias guardadas', 'Listo');
                },
                error: () => this.toastr.error('No se pudieron guardar tus preferencias'),
            });
    }
}
