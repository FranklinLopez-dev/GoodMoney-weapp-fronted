import { Injectable } from '@angular/core';
import { Banks } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class BanksService extends ApiCrudService<Banks> {
  constructor() {
    super('banks');
  }
}
