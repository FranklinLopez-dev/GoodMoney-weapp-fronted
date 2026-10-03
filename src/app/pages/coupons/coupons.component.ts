import { Component, inject } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MaterialModule } from 'src/app/material.module';
import { CouponsStore } from './coupons.store';
import { Coupons } from 'src/app/core/models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [MaterialModule, RouterModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss'
})
export class CouponsComponent {

  private clipboard = inject(Clipboard);
  public store = inject(CouponsStore);

  selectedStatuses: string[] = ['disponible'];

  get coupons(): Coupons[] {
    return this.store.items() ?? [];
  }

  constructor() {
    
  }

  get filteredCoupons(): Coupons[] {
    if (!this.selectedStatuses.length) return this.coupons;

    return this.coupons.filter(c =>
      this.selectedStatuses.includes(
        (c.statusText ?? '').toLowerCase()
      )
    );
  }

  copy(code: string): void {
    this.clipboard.copy(code);
  }

  getStatusClass(coupon: Coupons): string {
    const status = (coupon.statusText ?? '').toLowerCase();

    switch (status) {
      case 'disponible':
        return 'active';
      case 'usado':
        return 'used';
      case 'vencido':
      case 'inactivo':
        return 'inactive';
      default:
        return '';
    }
  }
}
