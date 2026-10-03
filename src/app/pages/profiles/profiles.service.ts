import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, Profiles } from 'src/app/core/models';
import { environment } from 'src/environments/environment';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { Socket } from 'src/app/core/models/utils/socket.model';

@Injectable({ providedIn: 'root' })
export class ProfilesService {

  private baseUrl = `${environment.apiUrl}/api/profiles`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Profiles[]> {
    return this.http.get<Profiles[]>(this.baseUrl);
  }

  getAllId(
    searchTerm: string,
    pageIndex: number,
    id: string
  ): Observable<HttpResponse<Profile[]>> {
    const params = parametrosDePagina(pageIndex, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

    return this.http.get<Profile[]>(`${this.baseUrl}/${id}/${searchTerm}`, {
      params,
      observe: 'response'
    });
  }

  getSearch(pageIndex: number, pageSize: number, searchTerm: string, searchTerm2: string, searchColumn: string, natural: string): Observable<HttpResponse<Profile[]>> {
    const params = parametrosDePagina(pageIndex, pageSize);

    return this.http.get<Profile[]>(`${this.baseUrl}/all/${natural}/${searchColumn}/${searchTerm}/${searchTerm2}`, {
      params,
      observe: 'response'
    });
  }

  getIsFromIndividual(pageIndex: number, pageSize: number, searchTerm: string): Observable<HttpResponse<Profile[]>> {
    const params = parametrosDePagina(pageIndex, pageSize);

    return this.http.get<Profile[]>(`${this.baseUrl}/filter/${searchTerm}`, {
      params,
      observe: 'response'
    });
  }


  getById(id: number) {
    return this.http.get<Profile>(`${this.baseUrl}/one/${id}`);
  }

  getByDocument(documentType: number, documentNumber: string) {
    return this.http.get<Profile>(`${this.baseUrl}/search-eprofile/${documentType}/${documentNumber}`);
  }

  getAdmin() {
    return this.http.get<Profile>(`${this.baseUrl}/admin`);
  }

  changeSelectedProfile(profileId: number) {
    return this.http.put(
      `${this.baseUrl}/change-selected-profile/${profileId}`,
      null,
      { responseType: 'text' }
    );
  }

  updateProfile(profile: Profile) {
    return this.http.put(
      `${this.baseUrl}/update-profile-by-admin`,
      profile,
      { responseType: 'text' }
    );
  }

  createNaturalAdmin(payload: Profile): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/admin-natural`,
      payload, { responseType: 'text' }
    );
  }

  createJuridicoAdmin(payload: Profile): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/admin-juridica`,
      payload, { responseType: 'text' }
    );
  }

  updateNaturalAdmin(payload: Profile): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/admin-natural`,
      payload, { responseType: 'text' }
    );
  }

  updateJuridicoAdmin(payload: Profile): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/admin-juridica`,
      payload, { responseType: 'text' }
    );
  }

  createNatural(payload: Profile): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/natural`,
      payload, { responseType: 'text' }
    );
  }

  createJuridico(payload: Profile): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/juridica`,
      payload, { responseType: 'text' }
    );
  }

  updateNatural(payload: Profile): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/natural`,
      payload, { responseType: 'text' }
    );
  }

  updateJuridico(payload: Profile): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/juridica`,
      payload, { responseType: 'text' }
    );
  }

  public updateProfileSocket(socket: Socket): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-socket-id`, socket, {
      responseType: 'text'
    });
  }

}
