import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';

/** Nombres de los estados KYC para la pantalla (la cola y la bandeja de operaciones). */
export const ESTADOS_KYC: Record<string, string> = {
    sin_validar: 'Sin validar',
    en_revision: 'En revisión',
    validado: 'Validado',
    observado: 'Observado',
    vencido: 'Vencido',
    suspendido: 'Suspendido',
};

export interface KycColaItem {
    personId: number;
    fullName: string;
    documentType: string | null;
    documentNumber: string;
    personType: string;
    kycEstado: string;
    kycActualizadoAt: string | null;
    kycVenceAt: string | null;
    kycObservacion: string | null;
    createdAt: string;
    documentos: number;
}

export interface ReglaKyc {
    regla: string;
    titulo: string;
    /** ok | falla | criterio */
    estado: string;
    detalle: string;
}

export interface KycRevision {
    id: number;
    fecha: string;
    userName: string | null;
    accion: string;
    estado: string;
    nota: string | null;
    reglas: ReglaKyc[] | null;
}

export interface KycFicha {
    persona: KycColaItem;
    reglasUltimaEvaluacion: ReglaKyc[];
    ultimaEvaluacionAt: string | null;
    documentos: { id: number; type: string; originalName: string | null; uploadedAt: string }[];
    historial: KycRevision[];
}

@Injectable({ providedIn: 'root' })
export class KycService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/kyc`;

    resumen(): Observable<Record<string, number>> {
        return this.http.get<Record<string, number>>(`${this.baseUrl}/resumen`);
    }

    cola(estado: string, valor: string, pageIndex: number, pageSize: number): Observable<HttpResponse<KycColaItem[]>> {
        let params = parametrosDePagina(pageIndex, pageSize).set('estado', estado);
        if (valor.trim()) params = params.set('valor', valor.trim());
        return this.http.get<KycColaItem[]>(`${this.baseUrl}/cola`, { params, observe: 'response' });
    }

    ficha(personId: number): Observable<KycFicha> {
        return this.http.get<KycFicha>(`${this.baseUrl}/${personId}`);
    }

    evaluar(personId: number): Observable<{ estado: string; reglas: ReglaKyc[] }> {
        return this.http.post<{ estado: string; reglas: ReglaKyc[] }>(`${this.baseUrl}/${personId}/evaluar`, {});
    }

    decidir(personId: number, accion: 'Validar' | 'Observar' | 'Suspender', nota: string | null): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${personId}/decision`, { accion, nota });
    }

    /** El documento de identidad, con la sesión (files/ no se sirve). */
    documento(personId: number, documentId: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${personId}/documentos/${documentId}`, { responseType: 'blob' });
    }
}
