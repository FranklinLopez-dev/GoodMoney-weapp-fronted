import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DiaAtencion {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
    note: string | null;
}

export interface HorarioRespuesta {
    days: DiaAtencion[];
    lines: string[];
    openNow: boolean;
}

/** Horario de atención: lo leen el panel, el sitio público y el propio API para saber si hay atención ahora. */
@Injectable({ providedIn: 'root' })
export class BusinessHoursService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/business-hours`;

    get(): Observable<HorarioRespuesta> {
        return this.http.get<HorarioRespuesta>(`${this.baseUrl}/public`);
    }

    update(dias: DiaAtencion[]): Observable<void> {
        return this.http.put<void>(this.baseUrl, dias);
    }
}
