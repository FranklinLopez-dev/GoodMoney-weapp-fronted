import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ClienteDeAlerta {
    nombre: string;
    documentNumber: string | null;
    email: string | null;
    cellPhone: string | null;
    /** Fijo, como respaldo para llamar cuando no hay celular. */
    phone: string | null;
}

export interface FilaInformeAlerta {
    id: number;
    type: 'COMPRA' | 'VENTA';
    targetPrice: number;
    comment: string | null;
    isActive: boolean;
    createdAt: string;
    triggeredAt: string | null;
    triggeredPrice: number | null;
    /** Cuánto tiene que moverse el tipo de cambio para que salte. Negativo = ya pasó. */
    falta: number;
    /** Hasta cuándo espera. Null = sin vencimiento. */
    expiresAt: string | null;
    cliente: ClienteDeAlerta | null;
}

export interface InformeAlertas {
    total: number;
    page: number;
    recordsPerPage: number;
    compraHoy: number;
    ventaHoy: number;
    resumen: {
        quierenVender: number;
        quierenComprar: number;
        masCercaVender: number | null;
        masCercaComprar: number | null;
    };
    filas: FilaInformeAlerta[];
}

/** La única vista que cruza las alertas de todos los clientes; por eso el API pide `alerts.report`. */
@Injectable({ providedIn: 'root' })
export class AlertsReportService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/exchange-rate-alerts/report`;

    obtener(opciones: {
        type?: string; soloActivas?: boolean; search?: string;
        page?: number; recordsPerPage?: number;
    }): Observable<InformeAlertas> {
        let params = new HttpParams()
            .set('page', opciones.page ?? 1)
            .set('recordsPerPage', opciones.recordsPerPage ?? 25)
            .set('soloActivas', opciones.soloActivas ?? true);

        if (opciones.type) params = params.set('type', opciones.type);
        if (opciones.search) params = params.set('search', opciones.search);

        return this.http.get<InformeAlertas>(this.baseUrl, { params });
    }
}
