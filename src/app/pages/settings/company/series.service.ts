import { Injectable } from "@angular/core";
import { Serie } from "src/app/core/models";
import { ApiCrudService } from "src/app/core/services/api-crud.service";

@Injectable({ providedIn: 'root' })
export class SeriesService extends ApiCrudService<Serie> {
  constructor() {
    super('series');
  }
}
