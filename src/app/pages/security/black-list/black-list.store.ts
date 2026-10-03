import { Injectable, signal } from '@angular/core';
import { BlackList, DocumentType } from 'src/app/core/models';
import { PagedListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class BlackListStore extends PagedListStore<BlackList> {

  private _documentTypes = signal<DocumentType[] | null>(null);
  readonly documentTypes = this._documentTypes.asReadonly();

  setDocumentTypes(items: DocumentType[]) {
    this._documentTypes.set(structuredClone(items));
  }

  override clear() {
    super.clear();
    this._documentTypes.set(null);
  }
}
