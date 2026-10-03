import { inject, Injectable } from "@angular/core";
import { PaymentConditions } from "src/app/core/models/settings/payment-conditions.model";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { PaymentConditionsService } from "./payment-conditions.service";
import { PaymentConditionsStore } from "./payment-conditions.store";

@Injectable({ providedIn: 'root' })
export class PaymentConditionsResolver extends CatalogoResolver<PaymentConditions> {
  protected service = inject(PaymentConditionsService);
  protected store = inject(PaymentConditionsStore);
}
