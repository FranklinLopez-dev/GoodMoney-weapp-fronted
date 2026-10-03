import { Injectable, signal, computed, inject } from '@angular/core';
import { timer, Subscription } from 'rxjs';
import { ExchangeRate } from 'src/app/core/models';
import { ExchangeRateService } from 'src/app/pages/settings/exchange-rates/exchange-rate.service';

@Injectable()
export class QuotePreviewStore {

  private exchangeService = inject(ExchangeRateService);

  private _rate = signal<ExchangeRate | null>(null);
  readonly rate = this._rate.asReadonly();

  private _inputChange = signal<string>('USD');
  readonly inputChange = this._inputChange.asReadonly();

  private _seconds = signal(300);
  readonly refreshTime = computed(() => {
    const sec = this._seconds();
    const min = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${min}:${s}`;
  });

  private clockSub?: Subscription;
  private refreshSub?: Subscription;

  start(): void {
    if (this.clockSub) return;

    this._seconds.set(300);

    this.clockSub = timer(0, 1000).subscribe(() => {
      this._seconds.update(v => Math.max(v - 1, 0));
    });

    this.refreshSub = timer(0, 300000).subscribe(() => {
      // En segundo plano: sin velar la página en cada refresco.
      this.exchangeService.getOne().subscribe(rate => {
        this._rate.set(rate);
        this._seconds.set(300);
      });
    });
  }

  setInputChage(type: string) {
    this._inputChange.set(type);
  }

  stop(): void {
    this.clockSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.clockSub = undefined;
    this.refreshSub = undefined;
  }

  setRate(rate: any): void {
    this._rate.set(rate);
  }
}
