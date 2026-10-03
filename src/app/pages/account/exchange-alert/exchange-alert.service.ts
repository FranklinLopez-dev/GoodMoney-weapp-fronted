import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';

export type TipoAlerta = 'COMPRA' | 'VENTA';

export interface ExchangeRateAlert {
    id: number;
    type: TipoAlerta;
    targetPrice: number;
    comment: string | null;
    isActive: boolean;
    createdAt: string;
    /** Hasta cuándo espera. Null = sin vencimiento. */
    expiresAt: string | null;
    triggeredAt: string | null;
    triggeredPrice: number | null;
}

export interface ExchangeRateAlertEdicion {
    type: TipoAlerta;
    targetPrice: number;
    comment: string | null;
    /** ISO en UTC, o null para "sin vencimiento". */
    expiresAt: string | null;
}

export interface PaginaAlertas {
    filas: ExchangeRateAlert[];
    total: number;
}

/** Alertas del cliente (`api/exchange-rate-alerts`). El usuario sale del token: ningún método admite un id. */
@Injectable({ providedIn: 'root' })
export class ExchangeAlertService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/exchange-rate-alerts`;

    /** El total viene en la cabecera `RecordsTotal`, como en el resto del panel. */
    listar(pagina: number, porPagina: number, valor?: string): Observable<PaginaAlertas> {
        let params = new HttpParams()
            .set('pagina', pagina)
            .set('recordsPorPagina', porPagina);

        if (valor?.trim()) params = params.set('valor', valor.trim());

        return this.http
            .get<ExchangeRateAlert[]>(this.baseUrl, { params, observe: 'response' })
            .pipe(map(r => ({
                filas: r.body ?? [],
                total: totalDelEncabezado(r.headers),
            })));
    }

    crear(data: ExchangeRateAlertEdicion): Observable<ExchangeRateAlert> {
        return this.http.post<ExchangeRateAlert>(this.baseUrl, data);
    }

    actualizar(id: number, data: ExchangeRateAlertEdicion): Observable<ExchangeRateAlert> {
        return this.http.put<ExchangeRateAlert>(`${this.baseUrl}/${id}`, data);
    }

    borrar(id: number): Observable<unknown> {
        return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
    }

    /** Borrado múltiple: es la papelera junto a "Marcar todo". */
    borrarVarias(ids: number[]): Observable<{ borradas: number }> {
        return this.http.post<{ borradas: number }>(`${this.baseUrl}/borrar`, ids);
    }
}
