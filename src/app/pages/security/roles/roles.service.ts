import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Roles, RolePermission } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class RolesService extends ApiCrudService<Roles> {
  constructor() {
    super('roles');
  }

  getPermissions(id: string): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.baseUrl}/permissions/${id}`);
  }
}
