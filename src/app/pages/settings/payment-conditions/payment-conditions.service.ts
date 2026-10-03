import { Injectable } from '@angular/core';
import { PaymentConditions } from 'src/app/core/models/settings/payment-conditions.model';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class PaymentConditionsService extends ApiCrudService<PaymentConditions> {
  constructor() {
    super('payment-conditions');
  }
}
