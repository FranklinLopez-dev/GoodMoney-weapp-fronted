import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from '@angular/core';
import { forkJoin, tap, finalize } from 'rxjs';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { BlackListService } from './black-list.service';
import { BlackListStore } from './black-list.store';
import { DocumentTypeService } from '../../settings/documents/document-type.service';

@Injectable({ providedIn: 'root' })
export class BlackListResolver {

  private blackListService = inject(BlackListService);
  private documentTypesService = inject(DocumentTypeService);
  private store = inject(BlackListStore);

  resolve() {
    const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
    const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;

    this.store.setLoading(true);

    return forkJoin({
      blacklist: this.blackListService.search('', pageIndex, pageSize),
      documentTypes: this.documentTypesService.getAll()
    }).pipe(
      tap(({ blacklist, documentTypes }) => {

        const data = blacklist.body ?? [];
        const totalRecords = totalDelEncabezado(blacklist.headers);

        this.store.set(data);
        this.store.setPagination(totalRecords, pageIndex, pageSize);
        this.store.setDocumentTypes(documentTypes);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
