import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupedData } from 'src/app/core/models';
import { DashboardStore } from '../../store/dashboard.store';

@Component({
  selector: 'kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss']
})
export class KpiCardsComponent {

  private store = inject(DashboardStore);
  readonly isAdmin = this.store.isAdmin();

  readonly totalCompras = computed(() =>
    this.sum(this.store.kpiCompras())
  );

  readonly totalVentas = computed(() =>
    this.sum(this.store.kpiVentas())
  );

  readonly totalUsers = computed(() =>
    this.sum(this.store.kpiUsers())
  );

  private sum(data: GroupedData[] | null): number {
    if (!data?.length) return 0;
    return data.reduce((acc, cur) => acc + (cur.amount ?? 0), 0);
  }
}
