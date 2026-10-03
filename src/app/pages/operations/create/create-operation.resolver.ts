import { Injectable, inject } from '@angular/core';
import { tap, switchMap } from 'rxjs';
import { OperationsService } from '../operations.service';
import { OperationCreateStore } from './store/operation-create.store';

@Injectable({ providedIn: 'root' })
export class CreateOperationResolver {

  private service = inject(OperationsService);
  private store = inject(OperationCreateStore);

  resolve() {
   
    this.store.clearOperationData();
    this.store.setLoading(true);

    return this.service.saveDate().pipe(
      switchMap(() => 
        this.service.getOperationTable()
      ),
      tap({
        next: table => {
          this.store.setTable(table);
          this.store.setLoading(false);
          this.store.startExchangeClock();
        },
        error: () => {
          this.store.setLoading(false);
        }
      })
    );
  }
}