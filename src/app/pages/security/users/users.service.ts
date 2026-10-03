import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, ClienteReporte, FiltrosClientes, Users } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private baseUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) { }

  search(
    searchTerm: string,
    pageIndex: number,
    pageSize: number
  ): Observable<HttpResponse<Users[]>> {
    const params = parametrosDePagina(pageIndex, pageSize);

    return this.http.get<Users[]>(`${this.baseUrl}/${searchTerm}`, {
      params,
      observe: 'response'
    });
  }

  searchClients(
    searchTerm: string,
    pageIndex: number,
    pageSize: number,
    emailConfirmed?: boolean | null,
    lockoutEnabled?: boolean | null
  ): Observable<HttpResponse<Users[]>> {
    let params = parametrosDePagina(pageIndex, pageSize);

    if (emailConfirmed !== null && emailConfirmed !== undefined) {
      params = params.set('emailConfirmed', emailConfirmed);
    }

    if (lockoutEnabled !== null && lockoutEnabled !== undefined) {
      params = params.set('lockoutEnabled', lockoutEnabled);
    }

    return this.http.get<Users[]>(`${this.baseUrl}/clients/${searchTerm}`, {
      params,
      observe: 'response'
    });
  }

  clientesParaReporte(filtros: FiltrosClientes): Observable<ClienteReporte[]> {
    return this.http.get<ClienteReporte[]>(`${this.baseUrl}/clients-report`, {
      params: this.parametrosDeReporte(filtros)
    });
  }

  excelClientes(filtros: FiltrosClientes): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/clients-report/excel`, {
      params: this.parametrosDeReporte(filtros),
      responseType: 'blob'
    });
  }

  private parametrosDeReporte(filtros: FiltrosClientes): HttpParams {
    let params = new HttpParams();

    if (filtros.busqueda) {
      params = params.set('valor', filtros.busqueda);
    }

    if (filtros.emailConfirmed !== null) {
      params = params.set('emailConfirmed', filtros.emailConfirmed);
    }

    if (filtros.lockoutEnabled !== null) {
      params = params.set('lockoutEnabled', filtros.lockoutEnabled);
    }

    return params;
  }

  public getClientId(id: string, starDate: string, endDate: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/client-one/${id}/${starDate}/${endDate}`);
  }

  enabledEmail(user: Users) {
    return this.http.put(`${this.baseUrl}/enabled-email`, user, { responseType: 'text' });
  }

  lockoutEnabled(user: Users) {
    return this.http.put(`${this.baseUrl}/lockout-enabled`, user, { responseType: 'text' });
  }

  changeEmail(user: Users) {
    return this.http.put(`${this.baseUrl}/change-email`, user, { responseType: 'text' });
  }

  updateRoles(user: Users) {
    return this.http.put(`${this.baseUrl}`, user, { responseType: 'text' });
  }

  getId(id: string): Observable<Users> {
    return this.http.get<Users>(`${this.baseUrl}/one/${id}`);
  }

  assignProfile(user: {userId: string, profileId: number}) {
    return this.http.post(`${this.baseUrl}/assign-profile`, user, { responseType: 'text' });
  }

}
