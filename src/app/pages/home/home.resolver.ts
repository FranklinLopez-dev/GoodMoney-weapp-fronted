import { aFechaApi } from 'src/app/shared/utils/fechas';
import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { DashboardStore } from './store/dashboard.store';
import { UtilsService } from 'src/app/core/services/common/utils.service';

@Injectable({ providedIn: 'root' })
export class DashboardResolver implements Resolve<void> {

  private store = inject(DashboardStore);
  private service = inject(UtilsService);

  resolve(): void {

    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    this.store.updateFilters(3, 1, {
      month: aFechaApi(firstDayOfMonth)
    });

  }
}
