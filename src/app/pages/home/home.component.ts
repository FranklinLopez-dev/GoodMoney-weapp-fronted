import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DashboardStore } from './store/dashboard.store';
import { DashboardFiltersComponent } from './components/dashboard-filters/dashboard-filters.component';
import { ExchangeRateComponent } from './components/exchange-rate/exchange-rate.component';
import { MaterialModule } from 'src/app/material.module';
import { QuotePreviewStore } from '../coupons/quote-preview/quote-preview.store';
import { RouterModule } from '@angular/router';
import { UtilsService } from 'src/app/core/services/common/utils.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MaterialModule, RouterModule, DashboardFiltersComponent, ExchangeRateComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {

  /** El saludo de la cabecera sale del perfil en uso. */
  appData = inject(UtilsService);

  private store = inject(DashboardStore);
  private quote = inject(QuotePreviewStore);

  ngOnInit(): void {
    this.quote.setRate(this.store.dashboard()?.exchangeRate);
  }

  ngOnDestroy() {
    this.store.clearCache();
  }

}
