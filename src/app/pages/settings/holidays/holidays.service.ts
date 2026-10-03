import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Feriado {
    id: number;
    /** ISO. Los recurrentes vienen ya trasladados al año consultado. */
    date: string;
    name: string;
    isRecurring: boolean;
}

@Injectable({ providedIn: 'root' })
export class HolidaysService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/holidays`;

    get(anio: number): Observable<Feriado[]> {
        return this.http.get<Feriado[]>(`${this.baseUrl}/${anio}`);
    }

    create(feriado: Partial<Feriado>): Observable<Feriado> {
        return this.http.post<Feriado>(this.baseUrl, feriado);
    }

    update(id: number, feriado: Partial<Feriado>): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, feriado);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
