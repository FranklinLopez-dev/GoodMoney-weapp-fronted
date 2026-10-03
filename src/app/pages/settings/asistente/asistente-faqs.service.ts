import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AsistenteFaq } from 'src/app/shared/components/asistente/asistente.service';

export type AsistenteFaqEdicion = Omit<AsistenteFaq, 'id'> & { id?: number };

@Injectable({ providedIn: 'root' })
export class AsistenteFaqsService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/assistant-faqs`;

    getAll(): Observable<AsistenteFaq[]> {
        return this.http.get<AsistenteFaq[]>(this.baseUrl);
    }

    create(data: AsistenteFaqEdicion): Observable<AsistenteFaq> {
        return this.http.post<AsistenteFaq>(this.baseUrl, data);
    }

    update(id: number, data: AsistenteFaqEdicion): Observable<unknown> {
        return this.http.put(`${this.baseUrl}/${id}`, data, { responseType: 'text' });
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
    }
}
