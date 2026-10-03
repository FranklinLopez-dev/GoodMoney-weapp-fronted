import { inject, Injectable } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { OperationsService } from '../../operations/operations.service';
import { ContabilityStore } from './contability.store';

@Injectable({ providedIn: 'root' })
export class ContabilityResolver {
    private service = inject(OperationsService);
    private store = inject(ContabilityStore);

    resolve() {

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        return this.service.getContability(year, month).pipe(
            tap(data => this.store.set(data)),
            // TEMPORAL: sin el endpoint el resolver tumbaba la navegacion; con null la vista abre y muestra su aviso.
            catchError(() => of(null))
        );
    }
}
