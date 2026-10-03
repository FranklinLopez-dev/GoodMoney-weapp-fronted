import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** Una fila de la bitácora de salientes. El cuerpo NO viene en el listado. */
export interface EnvioSaliente {
    id: number;
    channel: string;
    type: string | null;
    recipient: string | null;
    subject: string | null;
    status: string;
    reason: string | null;
    httpStatus: number | null;
    payloadBytes: number | null;
    createdAt: string;
    applicationUserId: string | null;
}

/** La fila entera, con el cuerpo y la respuesta cruda del proveedor. */
export interface EnvioSalienteDetalle extends EnvioSaliente {
    providerResponse: string | null;
    body: string | null;
}

export interface Pagina<T> {
    total: number;
    page: number;
    pageSize: number;
    items: T[];
}

export interface FiltroEnvios {
    channel?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface TrabajoCola {
    id: string;
    state: string;
    method: string;
    args: string;
    when: string | null;
}

export interface Cola {
    counts: { enqueued: number; scheduled: number; processing: number; failed: number };
    jobs: TrabajoCola[];
}

export interface FilaRegistro {
    id: number;
    message: string;
    level: string;
    timeStamp: string;
    exception: string | null;
}

/** `sinTabla` = el sink aún no ha escrito nada, así que la tabla no existe. */
export interface PaginaRegistro extends Pagina<FilaRegistro> {
    sinTabla?: boolean;
}

/** Soporte: salientes, cola y registro. Sin filtro por empresa como en NovoDivisas — Good Money no es multitenant. */
@Injectable({ providedIn: 'root' })
export class SupportService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/support`;

    envios(filtro: FiltroEnvios): Observable<Pagina<EnvioSaliente>> {
        let params = new HttpParams()
            .set('page', filtro.page ?? 1)
            .set('pageSize', filtro.pageSize ?? 50);

        if (filtro.channel) params = params.set('channel', filtro.channel);
        if (filtro.status) params = params.set('status', filtro.status);
        if (filtro.search) params = params.set('search', filtro.search);

        return this.http.get<Pagina<EnvioSaliente>>(`${this.baseUrl}/notifications`, { params });
    }

    envio(id: number): Observable<EnvioSalienteDetalle> {
        return this.http.get<EnvioSalienteDetalle>(`${this.baseUrl}/notifications/${id}`);
    }

    reintentar(id: number): Observable<{ enviado: boolean; omitido: boolean; motivo: string | null }> {
        return this.http.post<any>(`${this.baseUrl}/notifications/${id}/retry`, {});
    }

    cola(): Observable<Cola> {
        return this.http.get<Cola>(`${this.baseUrl}/queue`);
    }

    borrarTrabajo(jobId: string): Observable<{ deleted: boolean }> {
        return this.http.post<any>(`${this.baseUrl}/queue/${encodeURIComponent(jobId)}/delete`, {});
    }

    purgarCola(): Observable<{ borrados: number }> {
        return this.http.post<any>(`${this.baseUrl}/queue/purge`, {});
    }

    registro(level: string, search: string, page = 1, pageSize = 50): Observable<PaginaRegistro> {
        let params = new HttpParams().set('page', page).set('pageSize', pageSize);
        if (level) params = params.set('level', level);
        if (search) params = params.set('search', search);
        return this.http.get<PaginaRegistro>(`${this.baseUrl}/logs`, { params });
    }
}
