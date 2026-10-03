import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';

import { ExchangeRateService } from 'src/app/pages/settings/exchange-rates/exchange-rate.service';
import { QuotePreviewStore } from './quote-preview.store';

@Injectable()
export class QuotePreviewResolver {
    private service = inject(ExchangeRateService);
    private store = inject(QuotePreviewStore);

    resolve() {
        return this.service.getOne().pipe(
            tap(rate => {
                this.store.setRate(rate);
            })
        );
    }
}
