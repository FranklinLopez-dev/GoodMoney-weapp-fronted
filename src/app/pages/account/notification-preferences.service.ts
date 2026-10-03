import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Un tipo de aviso con lo que el usuario tiene elegido para él. */
export interface NotificationPreference {
    type: string;
    label: string;
    description: string;
    inApp: boolean;
    email: boolean;
    whatsApp: boolean;
    /** No se puede apagar: se avisa igual, con o sin preferencia. */
    mandatory: boolean;
    /** Este aviso existe en la campana del panel. */
    hasInApp: boolean;
    /** Este aviso existe por correo. Si es false no se pinta el interruptor. */
    hasEmail: boolean;
    /** El API lo pone en false tanto si el aviso no admite WhatsApp como si el canal está apagado. */
    hasWhatsApp: boolean;
}

/** Un bloque de la pantalla: lo mío como cliente, o lo mío como parte del equipo. */
export interface NotificationPreferenceGroup {
    audience: 'cliente' | 'equipo';
    title: string;
    subtitle: string;
    preferences: NotificationPreference[];
}

export interface NotificationPreferencesResponse {
    isTeam: boolean;
    groups: NotificationPreferenceGroup[];
}

/** El catálogo de tipos viene del API: añadir un aviso nuevo no debería obligar a desplegar el frontend. */
@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {

    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get(): Observable<NotificationPreferencesResponse> {
        return this.http.get<NotificationPreferencesResponse>(
            `${this.baseUrl}/api/notification-preferences`);
    }

    save(preferencias: NotificationPreference[]): Observable<void> {
        const cuerpo = preferencias.map(p => ({
            type: p.type,
            inApp: p.inApp,
            email: p.email,
        }));

        return this.http.put<void>(`${this.baseUrl}/api/notification-preferences`, cuerpo);
    }
}
