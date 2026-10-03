import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SeasonalLogo {
    id: number;
    name: string;
    /** Base64 sin el prefijo data:...;base64,. */
    image: string;
    from: string;
    to: string;
    isActive: boolean;
}

export type SeasonalLogoEdicion = Omit<SeasonalLogo, 'id' | 'image'> & { id?: number; image?: string };

/** Mientras hoy caiga en el rango de uno activo, el API lo devuelve en vez del logo de siempre. */
@Injectable({ providedIn: 'root' })
export class SeasonalLogosService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/seasonal-logos`;

    getAll(): Observable<SeasonalLogo[]> {
        return this.http.get<SeasonalLogo[]>(this.baseUrl);
    }

    create(data: SeasonalLogoEdicion): Observable<SeasonalLogo> {
        return this.http.post<SeasonalLogo>(this.baseUrl, data);
    }

    update(id: number, data: SeasonalLogoEdicion): Observable<unknown> {
        return this.http.put(`${this.baseUrl}/${id}`, data, { responseType: 'text' });
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
    }
}
