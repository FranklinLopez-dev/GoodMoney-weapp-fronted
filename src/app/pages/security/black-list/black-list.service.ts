import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BlackList, BlackListReporte } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BlackListService {
    private baseUrl = `${environment.apiUrl}/api/blacklist`;

    constructor(private http: HttpClient) { }

    search(
        searchTerm: string,
        pageIndex: number,
        pageSize: number
    ): Observable<HttpResponse<BlackList[]>> {
        const params = parametrosDePagina(pageIndex, pageSize);

        return this.http.get<BlackList[]>(`${this.baseUrl}/${searchTerm}`, {
            params,
            observe: 'response'
        });

    }

    registrosParaReporte(busqueda: string): Observable<BlackListReporte[]> {
        return this.http.get<BlackListReporte[]>(`${this.baseUrl}/report/list`, {
            params: this.parametrosDeReporte(busqueda)
        });
    }

    excel(busqueda: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/report/excel`, {
            params: this.parametrosDeReporte(busqueda),
            responseType: 'blob'
        });
    }

    private parametrosDeReporte(busqueda: string): HttpParams {
        return busqueda ? new HttpParams().set('valor', busqueda) : new HttpParams();
    }

    create(data: Partial<BlackList>): Observable<BlackList> {
        return this.http.post<BlackList>(this.baseUrl, data);
    }

    delete(id: number): Observable<string> {
        return this.http.delete(`${this.baseUrl}/${id}`, { body: null, responseType: 'text' });
    }
}