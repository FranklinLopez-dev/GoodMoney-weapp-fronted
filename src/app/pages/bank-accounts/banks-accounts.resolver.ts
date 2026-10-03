import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { BanksAccountsStore } from './banks-accounts.store';
import { BanksAccountsService } from './bank-accounts.service';
import { OperationCreateStore } from '../operations/create/store/operation-create.store';

@Injectable({ providedIn: 'root' })
export class BanksAccountsResolver {

  private service = inject(BanksAccountsService);
  private store = inject(BanksAccountsStore);
  private storeOperation = inject(OperationCreateStore);

  resolve() {
    return forkJoin({
      accounts: this.service.getAll().pipe(catchError(() => of([]))),
      tables: this.service.getTables().pipe(catchError(() => of(null as any)))
    }).pipe(
      tap(({ accounts, tables }) => {
        this.store.setAccounts(accounts);
        this.storeOperation.setBankAccounts(accounts);
        if (tables) this.store.setTables(tables);
      }),
      // Si una llamada falla el forkJoin moría y la pantalla se quedaba en "Cargando página" para siempre.
      catchError(() => of(null))
    );
  }
}
