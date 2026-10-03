import { Injectable } from '@angular/core';
import { DocumentType } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class DocumentTypeService extends ApiCrudService<DocumentType> {
  constructor() {
    super('document-types');
  }
}
