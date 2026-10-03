import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Permissions } from 'src/app/core/models/security/permissions.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private baseUrl = `${environment.apiUrl}/api/permissions`;

  private permissionsCache: Permissions[] | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Permissions[]> {
    if (this.permissionsCache) {
      return of(this.permissionsCache);
    }

    return this.http.get<Permissions[]>(this.baseUrl).pipe(
      tap(perms => this.permissionsCache = perms)
    );
  }

  clearCache(): void {
    this.permissionsCache = null;
  }

  saveRolePermissions(roleId: string, permissions: Permissions[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/save/${roleId}`,
      permissions,
      { responseType: 'text' }
    );
  }
}
