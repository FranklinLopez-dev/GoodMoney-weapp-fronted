import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ProfileBanks, ProfileBanksTable } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BanksAccountsService {

  private baseUrl = `${environment.apiUrl}/api/profileBank-banks`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<ProfileBanks[]> {
    return this.http.get<ProfileBanks[]>(this.baseUrl);
  }

  getAllId(idProfile: number): Observable<ProfileBanks[]> {
    return this.http.get<ProfileBanks[]>(`${this.baseUrl}/get-banks-by-id/${idProfile}`);
  }

  getTables(): Observable<ProfileBanksTable> {
    return this.http.get<ProfileBanksTable>(`${this.baseUrl}/tables`)
      .pipe(
        map(table => ({
          ...table,
          banks: table.banks.map(bank => ({
            ...bank,
            icon: `data:image/jpeg;base64,${bank.icon}`
          })),
        })),
      );
  }

  save(payload: ProfileBanks): Observable<any> {
    return this.http.post(
      `${this.baseUrl}`,
      payload, { responseType: 'text' }
    );
  }

  saveAdmi(payload: ProfileBanks): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/admin`,
      payload, { responseType: 'text' }
    );
  }

  update(payload: ProfileBanks): Observable<any> {
    return this.http.put(
      `${this.baseUrl}`,
      payload, { responseType: 'text' }
    );
  }

  delete(profileBank: ProfileBanks): Observable<any> {
    return this.http.request('delete', `${this.baseUrl}`, { body: profileBank, responseType: 'text' });
  }

  deleteAdmin(profileBank: ProfileBanks): Observable<any> {
    return this.http.request('delete', `${this.baseUrl}/admin`, { body: profileBank, responseType: 'text' });
  }

}
