import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Positions } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class PositionsService extends ApiCrudService<Positions, Positions> {
  constructor() {
    super('positions');
  }

  override create(data: Partial<Positions>): Observable<Positions> {
    return this.http.post<Positions>(this.baseUrl, data);
  }
}
