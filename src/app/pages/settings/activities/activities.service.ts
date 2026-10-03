import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activities } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class ActivitiesService extends ApiCrudService<Activities, Activities> {
  constructor() {
    super('activities');
  }

  override create(data: Partial<Activities>): Observable<Activities> {
    return this.http.post<Activities>(this.baseUrl, data);
  }
}
