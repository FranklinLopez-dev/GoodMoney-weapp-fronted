import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { OperationsService } from '../operations.service';
import { NovodivisasStore } from './novodivisas.store';


@Injectable({ providedIn: 'root' })
export class NovodivisasResolver {

  private service = inject(OperationsService);
  private store = inject(NovodivisasStore);

  resolve() {
    this.store.clearAll();
    this.store.setLoading(true);

    return this.service.getOperationTable().pipe(
      tap({
        next: table => {
          this.store.setTable(table);
          this.store.setLoading(false);
        },
        error: () => {
          this.store.setLoading(false);
        }
      })
    );
  }
}
