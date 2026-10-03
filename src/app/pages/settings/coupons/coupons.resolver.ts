import { inject, Injectable } from '@angular/core';
import { of, tap } from 'rxjs';
import { CouponsService } from './coupons.service';
import { CouponsStore } from './coupons.store';

@Injectable({ providedIn: 'root' })
export class CouponsResolver {
  private service = inject(CouponsService);
  private store = inject(CouponsStore);

  resolve() {
    return this.service.getAll().pipe(
      tap(data => this.store.set(data))
    );
  }
}
