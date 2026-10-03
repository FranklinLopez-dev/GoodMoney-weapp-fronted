import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SystemSettings {
    whatsAppEnabled: boolean;
    whatsAppUrl: string | null;
    /** Llega como '********' si hay uno guardado; nunca el valor real. */
    whatsAppToken: string | null;
    whatsAppInstance: string | null;
    whatsAppPhone: string | null;

    mailHost: string | null;
    mailPort: number;
    mailFrom: string | null;
    mailDisplayName: string | null;
    /** A dónde van las respuestas del cliente (Reply-To). Vacío = al remitente. */
    mailReplyTo: string | null;
    mailUser: string | null;
    /** Enmascarada, igual que el token. */
    mailPassword: string | null;
    mailUseSsl: boolean;

    iaEnabled: boolean;
    iaApiToken: string | null;
    iaModel: string | null;
    iaMaxConsultasDia: number;
    iaPromptBase: string | null;

    reCaptchaEnabled: boolean;
    /** 'v2' (casilla) o 'v3' (invisible, por puntuacion). */
    reCaptchaVersion: string;
    /** NO es secreto: va en el HTML de los formularios, asi que llega tal cual. */
    reCaptchaSiteKey: string | null;
    /** Enmascarada, como el resto de secretos. */
    reCaptchaSecretKey: string | null;
    /** Umbral de la v3, 0 a 1. Por debajo se rechaza el envio. */
    reCaptchaMinScore: number;

    // Solo lectura: lo calcula el servidor.
    whatsAppOperativo: boolean;
    correoOperativo: boolean;
    iaOperativa: boolean;
    reCaptchaOperativo: boolean;
}

export interface EstadoWhatsApp {
    configurado: boolean;
    conectado: boolean;
    estado: string | null;
    motivo: string | null;
}

/** QR de vinculación. Caduca solo, así que se pide cada vez y no se guarda. */
export interface QrWhatsApp {
    /** `data:image/png;base64,…`, listo para un <img>. */
    imagen: string | null;
    codigo: string | null;
    omitido: boolean;
    yaConectado: boolean;
    motivo: string | null;
}

/** El API sustituye los tres secretos por `********`; devolver esa máscara al guardar significa "no lo toques". */
@Injectable({ providedIn: 'root' })
export class SystemSettingsService {

    /** Lo que el API entiende como "deja el secreto que ya estaba". */
    static readonly MASCARA = '********';

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/system-settings`;

    get(): Observable<SystemSettings> {
        return this.http.get<SystemSettings>(this.baseUrl);
    }

    guardar(data: SystemSettings): Observable<SystemSettings> {
        return this.http.put<SystemSettings>(this.baseUrl, data);
    }

    estadoWhatsApp(): Observable<EstadoWhatsApp> {
        return this.http.get<EstadoWhatsApp>(`${this.baseUrl}/whatsapp/estado`);
    }

    probarWhatsApp(numero: string): Observable<{ enviado: boolean; omitido: boolean; motivo: string | null; numero: string }> {
        return this.http.post<any>(`${this.baseUrl}/whatsapp/prueba`, { numero });
    }

    /** POST y no GET porque abre una vinculación: quien escanee el código queda enlazado a la cuenta de la empresa. */
    conectarWhatsApp(): Observable<QrWhatsApp> {
        return this.http.post<QrWhatsApp>(`${this.baseUrl}/whatsapp/conectar`, {});
    }
}
