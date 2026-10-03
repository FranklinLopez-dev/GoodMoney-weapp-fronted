import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LadoEmbudo {
    n: number;
    montoUsd: number;
    totalPen: number;
}

/** Compra = la casa compra dólares (el cliente vende); venta = la casa los vende. */
export interface PasoEmbudo {
    clave: 'cotizaron' | 'cotizacion_usada' | 'registraron' | 'transfirieron' | 'recibida' | 'enviada' | 'finalizada';
    paso: string;
    compra: LadoEmbudo;
    venta: LadoEmbudo;
}

export interface Embudo {
    desde: string;
    hasta: string;
    /** Desde qué día el paso "Cotizaron" está completo. Null: no hay ninguna cotización guardada. */
    cotizacionesDesde: string | null;
    cotizacionesIncompletas: boolean;
    embudo: PasoEmbudo[];
    canceladas: { total: number; cliente: number; sistema: number; equipo: number; sinTransferir: number };
    /** De la transferencia del cliente a la operación finalizada. Null si no se finalizó ninguna en el rango. */
    atencion: { operaciones: number; promedioMinutos: number; medianaMinutos: number } | null;
    perfilesNuevos: number;
    /** Operaciones antiguas sin creador guardado: no entran al embudo. */
    operacionesSinOrigen: number;
    /** Sin permiso de ver clientes (user.index) no llegan nombres ni documentos. */
    topClientesOculto: boolean;
    porDia: { dia: string; registradas: number; finalizadas: number; canceladas: number; finalizadoUsd: number }[];
    topClientes: { eProfileId: number; nombre: string; documento: string | null; operaciones: number; montoUsd: number; totalPen: number }[];
}

@Injectable({ providedIn: 'root' })
export class EmbudoService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/reportes/embudo`;

    obtener(desde: string, hasta: string): Observable<Embudo> {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta);
        return this.http.get<Embudo>(this.baseUrl, { params });
    }
}
