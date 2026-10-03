import { aFechaApi } from 'src/app/shared/utils/fechas';
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { ExchangeRateService } from "./exchange-rate.service";
import { ExchangeRateStore } from "./exchange-rate.store";

@Injectable({ providedIn: 'root' })
export class ExchangeRateResolver {
  private service = inject(ExchangeRateService);
  private store = inject(ExchangeRateStore);

  resolve() {
    const today = aFechaApi(new Date());
    return this.service.getAll(today, today).pipe(
      tap((data) => {
        this.store.set(data);
      })
    );
  }

}
