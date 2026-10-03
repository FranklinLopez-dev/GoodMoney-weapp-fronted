import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ProfileTables } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfilesTablesService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/profiles`;

  getTables() {
    return this.http.get<ProfileTables>(`${this.baseUrl}/tables`);
  }
}
