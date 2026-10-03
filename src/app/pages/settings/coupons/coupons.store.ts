import { Injectable } from '@angular/core';
import { Coupons } from 'src/app/core/models';
import { ListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class CouponsStore extends ListStore<Coupons> {

  add(item: Coupons) {
    const current = this.getItems() ?? [];
    this.setItems([...current, item]);
  }

  update(id: number, item: Partial<Coupons>) {
    const current = this.getItems() ?? [];
    const index = current.findIndex(x => x.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...item };
      this.setItems([...current]);
    }
  }

  remove(id: number) {
    const current = this.getItems() ?? [];
    this.setItems(current.filter(x => x.id !== id));
  }
}
