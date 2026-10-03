import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { CouponsService } from '../settings/coupons/coupons.service';
import { CouponsStore } from './coupons.store';

@Injectable({ providedIn: 'root' })
export class CouponsResolver {
  private service = inject(CouponsService);
  private store = inject(CouponsStore);

  resolve() {
    return this.service.getAllClient().pipe(
      tap(data => this.store.set(data))
    );
  }
}
