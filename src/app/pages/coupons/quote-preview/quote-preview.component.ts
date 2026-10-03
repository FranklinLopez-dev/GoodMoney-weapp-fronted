import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  effect
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { CouponsService } from 'src/app/pages/settings/coupons/coupons.service';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AmountInputDirective } from 'src/app/shared/directives/amount-input.directive';
import { QuotePreviewStore } from './quote-preview.store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
    AmountInputDirective,
    RouterModule
  ],
  templateUrl: './quote-preview.component.html',
  styleUrls: ['./quote-preview.component.scss']
})
export class QuotePreviewComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private store = inject(QuotePreviewStore);
  private couponService = inject(CouponsService);

  readonly rate = this.store.rate;
  readonly refreshTime = this.store.refreshTime;
  private inputChange = this.store.inputChange;

  form!: FormGroup;
  isLoading = signal(false);

  private subs: Subscription[] = [];

  constructor() {
    this.listenRateChanges();
  }

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.initForm();
    this.bindCalculations();
    this.store.start();

  }

  private initForm(): void {
    const rate = this.rate();

    this.form.addControl('operationType', this.fb.control<'BUY' | 'SELL'>('BUY'));
    this.form.addControl('amountUsd', this.fb.control(1000, Validators.required));
    this.form.addControl('amountPen', this.fb.control(0, Validators.required));
    this.form.addControl('coupon', this.fb.control(null));
    this.form.addControl('couponCode', this.fb.control(null));

    this.form.addControl('baseRate', this.fb.group({
      priceCompra: [rate?.priceCompra ?? 0],
      priceVenta: [rate?.priceVenta ?? 0],
    }));

    this.form.addControl('effectiveRate', this.fb.group({
      priceCompra: [rate?.priceCompra ?? 0],
      priceVenta: [rate?.priceVenta ?? 0],
    }));

    queueMicrotask(() => {
      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd();
      } else {
        this.recalculateFromPen();
      }
    });
  }

  private bindCalculations(): void {
    this.subs.push(
      this.form.get('amountUsd')!.valueChanges.subscribe(v => {
        this.store.setInputChage('USD');
        this.recalculateFromUsd(v)
      }
      ),
      this.form.get('amountPen')!.valueChanges.subscribe(v => {
        this.store.setInputChage('PEN');
        this.recalculateFromPen(v)
      }
      )
    );
  }

  private listenRateChanges(): void {
    effect(() => {
      const rate = this.rate();
      if (!rate || !this.form) return;

      const baseRate = {
        priceCompra: rate.priceCompra,
        priceVenta: rate.priceVenta
      };

      const hasCoupon = !!this.form.value.coupon;

      this.form.get('baseRate')?.patchValue(baseRate, {
        emitEvent: false
      });

      const effectiveRate = hasCoupon
        ? this.applyCouponToRate(baseRate)
        : baseRate;

      this.form.get('effectiveRate')?.patchValue(effectiveRate, {
        emitEvent: false
      });

      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd();
      } else {
        this.recalculateFromPen();
      }
    });
  }

  private recalculateFromUsd(value?: number): void {
    const type = this.form.value.operationType;
    const rate =
      type === 'BUY'
        ? this.form.value.effectiveRate.priceCompra
        : this.form.value.effectiveRate.priceVenta;

    const pen = Number(value ?? this.form.value.amountUsd) * rate;
    this.form.get('amountPen')!
      .setValue(this.round(pen), { emitEvent: false });
  }

  private recalculateFromPen(value?: number): void {
    const type = this.form.value.operationType;
    const rate =
      type === 'BUY'
        ? this.form.value.effectiveRate.priceCompra
        : this.form.value.effectiveRate.priceVenta;

    const usd = Number(value ?? this.form.value.amountPen) / rate;
    this.form.get('amountUsd')!
      .setValue(this.round(usd), { emitEvent: false });
  }

  applyCoupon(): void {
    const code = this.form.value.couponCode;
    if (!code) return;

    this.isLoading.set(true);

    this.couponService.getCouponsCode(code).subscribe(coupon => {
      this.form.get('coupon')!.setValue(coupon);
      this.form.patchValue({
        effectiveRate: this.applyCouponToRate(this.form.value.baseRate)
      }, { emitEvent: false });

      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd();
      } else {
        this.recalculateFromPen();
      }
      this.isLoading.set(false);
    });
  }

  removeCoupon(): void {
    this.form.patchValue({
      coupon: null,
      couponCode: null,
      effectiveRate: this.form.value.baseRate
    }, { emitEvent: false });

    if (this.inputChange() == 'USD') {
      this.recalculateFromUsd();
    } else {
      this.recalculateFromPen();
    }
  }

  swapAmounts(): void {
    const current = this.form.value.operationType;
    this.form.get('operationType')!.setValue(
      current === 'BUY' ? 'SELL' : 'BUY'
    );
    if (this.inputChange() == 'USD') {
      this.recalculateFromUsd();
    } else {
      this.recalculateFromPen();
    }
  }

  private applyCouponToRate(rate: any) {
    const coupon = this.form.value.coupon;
    if (!coupon) return rate;

    const r = structuredClone(rate);
    if (coupon.isCompra) r.priceCompra += coupon.discount;
    if (coupon.isVenta) r.priceVenta -= coupon.discount;
    return r;
  }

  private round(v: number): number {
    return Number(v.toFixed(2));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.store.stop();
  }
}
