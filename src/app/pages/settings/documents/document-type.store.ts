import { Injectable } from '@angular/core';
import { DocumentType } from 'src/app/core/models';
import { CrudStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class DocumentTypeStore extends CrudStore<DocumentType> {}
