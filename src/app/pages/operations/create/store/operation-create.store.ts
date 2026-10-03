import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { timer, Subscription, of, fromEvent, merge } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExchangeRateService } from 'src/app/pages/settings/exchange-rates/exchange-rate.service';
import { OperationsService, Cotizacion } from 'src/app/pages/operations/operations.service';
import { OperationTable } from 'src/app/core/models/operations/operations.model';
import { Coupons, Profile, ProfileBanks } from 'src/app/core/models';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

export type OperationStep = 1 | 2 | 3 | 4;

@Injectable()
export class OperationCreateStore {


  private _table = signal<OperationTable | null>(null);
  private _step = signal<OperationStep>(1);
  private _loading = signal(false);

  readonly table = this._table.asReadonly();
  readonly step = this._step.asReadonly();
  readonly loading = this._loading.asReadonly();


  private _quote = signal<any | null>(null);
  private _accounts = signal<any | null>(null);
  private _transfer = signal<any | null>(null);
  private _voucher = signal<any | null>(null);

  readonly quote = this._quote.asReadonly();
  readonly accounts = this._accounts.asReadonly();
  readonly transfer = this._transfer.asReadonly();
  readonly voucher = this._voucher.asReadonly();

  private _inputChange = signal<string>('USD');
  readonly inputChange = this._inputChange.asReadonly();

  /**
   * La cotización sellada por el servidor al pasar a las cuentas: su tipo de cambio queda reservado hasta que
   * vence (y el refresco de la pizarra ya no lo toca). Al volver a "Cotiza" se descarta y se sella otra.
   */
  private _cotizacion = signal<Cotizacion | null>(null);
  readonly cotizacion = this._cotizacion.asReadonly();
  /** Cuándo vence, en el reloj del navegador (el servidor manda los segundos que quedan, no la hora). */
  private _cotizacionVence = signal<number | null>(null);

  setCotizacion(c: Cotizacion): void {
    this._cotizacion.set(c);
    this._cotizacionVence.set(Date.now() + c.segundosRestantes * 1000);
  }

  clearCotizacion(): void {
    this._cotizacion.set(null);
    this._cotizacionVence.set(null);
  }

  /** Segundos de reserva que quedan (0 si venció o no hay cotización). */
  readonly segundosDeReserva = computed(() => {
    const vence = this._cotizacionVence();
    return vence === null ? 0 : Math.max(0, Math.floor((vence - this.now().getTime()) / 1000));
  });

  /** "mm:ss" de reserva que queda, o null si no hay cotización sellada. */
  readonly reservaRestante = computed(() => {
    if (this._cotizacionVence() === null) return null;
    const sec = this.segundosDeReserva();
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  });


  private _bankAccounts = signal<ProfileBanks[] | []>([]);
  readonly bankAccounts = this._bankAccounts.asReadonly();

  readonly hasBankAccounts = computed(
    () => !!this._bankAccounts()?.length
  );


  private _quoteForm = signal<FormGroup | null>(null);

  setQuoteForm(form: FormGroup): void {
    if (!this._quoteForm()) {
      this._quoteForm.set(form);
    }
  }

  setInputChage(type: string) {
    this._inputChange.set(type);
  }


  private readonly DEFAULT_REFRESH = 300; // 300

  refreshSeconds = signal(this.DEFAULT_REFRESH);

  readonly refreshTime = computed(() => {
    const sec = this.refreshSeconds();
    const min = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${min}:${s}`;
  });

  private refreshSub?: Subscription;
  private countdownSub?: Subscription;

  /** Lo refresca el MISMO contador: un `timer` aparte disparaba una deteccion de cambios del arbol entero por tick. */
  readonly now = signal(new Date());


  private _operationLocked = signal(false);
  private _operationExpired = signal(false);

  readonly operationLocked = this._operationLocked.asReadonly();
  readonly operationExpired = this._operationExpired.asReadonly();

  private _legalRep = signal<Profile | null>(null);
  readonly legalRep = this._legalRep.asReadonly();


  private _coupon = signal<Coupons | null>(null);
  readonly coupon = this._coupon.asReadonly();


  private exchangeService = inject(ExchangeRateService);
  private operationsService = inject(OperationsService);


  constructor(private toastr: ToastrService) {
    this.listenConnectionChanges();

    effect(() => {
      const seconds = this.refreshSeconds();
      const step = this._step();
      const locked = this._operationLocked();

      if (
        locked &&
        (step === 3 || step === 4) &&
        seconds === 0
      ) {
        this.toastr.warning(
          'Su tiempo para realiza la transferencia a terminado',
          'Advertencia'
        );

        this._operationExpired.set(true);

        queueMicrotask(() => {
          this.hardReset();
        });
      }
    });


    effect(() => {
      const table = this._table();
      const form = this._quoteForm();
      const step = this._step();

      if (!table || !form) return;

      if (step >= 3) return;
      // Con la cotización sellada, el tipo de cambio ya no sigue a la pizarra.
      if (this._cotizacion()) return;

      const rate = table.exchangeRate;
      if (!rate) return;

      const coupon = form.value.coupon;
      const effectiveRate = coupon
        ? this.applyCoupon(rate, coupon)
        : rate;

      form.patchValue({
        baseRate: rate,
        effectiveRate
      }, { emitEvent: false });

      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd(form);
      } else {
        this.recalculateFromPen(form);
      }

    });

  }


  private recalculateFromUsd(form: FormGroup): void {
    const type = form.value.operationType;
    if (!type) return;

    const rate =
      type === 'BUY'
        ? form.value.effectiveRate?.priceCompra
        : form.value.effectiveRate?.priceVenta;

    if (!rate) return;

    const usd = Number(form.value.amountUsd ?? 0);
    const pen = usd * rate;

    form.get('amountPen')?.setValue(
      Number(pen.toFixed(2)),
      { emitEvent: false }
    );

    this.setQuote(this._quoteForm()?.value);
  }

  private recalculateFromPen(form: FormGroup): void {
    const type = form.value.operationType;
    if (!type) return;

    const rate =
      type === 'BUY'
        ? form.value.effectiveRate?.priceCompra
        : form.value.effectiveRate?.priceVenta;

    if (!rate) return;

    const pen = Number(form.value.amountPen ?? 0);
    const usd = pen / rate;

    form.get('amountUsd')?.setValue(
      Number(usd.toFixed(2)),
      { emitEvent: false }
    );

    this.setQuote(this._quoteForm()?.value);
  }

  private applyCoupon(rate: any, coupon: Coupons) {
    const r = structuredClone(rate);
    if (coupon.isCompra) r.priceCompra += coupon.discount;
    if (coupon.isVenta) r.priceVenta -= coupon.discount;
    return r;
  }


  setLegalRep(profile: Profile): void {
    this._legalRep.set(structuredClone(profile));
  }

  setTable(table: OperationTable): void {
    this._table.set(structuredClone(table));
  }

  clearTable(): void {
    this._table.set(null);
  }

  table$() {
    return of(this._table());
  }


  nextStep(): void {
    this._step.update(s => {
      const next = (s < 4 ? (s + 1) as OperationStep : s);
      if (next === 3 && s !== 3) {
        this.enterOperationLock();
      }

      return next;
    });
  }

  prevStep(): void {
    if (this._operationLocked()) return;
    this._step.update(s => (s > 1 ? (s - 1) as OperationStep : s));
    if (this._step() === 1) this.clearCotizacion();
  }

  setStep(step: OperationStep): void {
    this._step.set(step);
    if (step === 1) this.clearCotizacion();
  }


  setQuote(data: any): void {
    this._quote.set(structuredClone(data));
  }

  setAccounts(data: any): void {
    this._accounts.set(structuredClone(data));
  }

  setTransfer(data: any): void {
    this._transfer.set(structuredClone(data));
  }

  setVoucher(data: any): void {
    this._voucher.set(structuredClone(data));
  }

  setBankAccounts(accounts: ProfileBanks[]): void {
    this._bankAccounts.set(structuredClone(accounts));
  }

  updateBankAccounts(updated: ProfileBanks) {
    this._bankAccounts.update(accounts =>
      accounts.map(acc =>
        acc.id === updated.id ? { ...updated } : acc
      )
    );
  }

  removeBankAccounts(id: number) {
    this._bankAccounts.update(accounts =>
      accounts.filter(acc => acc.id !== id)
    );
  }


  setCoupon(coupon: Coupons | null): void {
    this._coupon.set(coupon ? structuredClone(coupon) : null);
  }

  setLoading(value: boolean): void {
    this._loading.set(value);
  }


  startExchangeClock(): void {
    if (this.refreshSub) return;

    this.refreshSeconds.set(this.DEFAULT_REFRESH);

    this.now.set(new Date());

    this.countdownSub = timer(0, 1000).subscribe(() => {
      const current = this.refreshSeconds() - 1;
      this.refreshSeconds.set(Math.max(current, 0));
      this.now.set(new Date());
    });

    this.refreshSub = timer(0, this.DEFAULT_REFRESH * 1000)
      .subscribe(() => {
        const table = this._table();
        if (!table || this._operationLocked()) return;

        // Se remarca en el servidor ANTES de traer la tasa nueva: si no, su reloj se queda al cotizar y rechaza operaciones.
        this.operationsService.saveDate().subscribe(() => {
          this.exchangeService.getOne().subscribe(rate => {
            this.setTable({
              ...table,
              exchangeRate: rate
            });
            this.refreshSeconds.set(this.DEFAULT_REFRESH);
          });
        });
      });
  }


  enterOperationLock(): void {
    const table = this._table();
    if (!table) return;

    this._operationLocked.set(true);
    this.refreshSeconds.set(table.company.operationTime * 60);

    this.refreshSub?.unsubscribe();
    this.refreshSub = undefined;
  }

  /** Limpia solo los datos de la operación; mantiene la tabla y la configuración del store. */
  clearOperationData(): void {
    this.clearCotizacion();
    this._quote.set(null);
    this._accounts.set(null);
    this._transfer.set(null);
    this._voucher.set(null);
    this._step.set(1);
    this._inputChange.set('USD');
    this._quoteForm.set(null);
  }

  reset(): void {
    this.clearOperationData();
    this._bankAccounts.set([]);
    this._coupon.set(null);
    this._inputChange.set('USD');
    this._legalRep.set(null);
    this._table.set(null);
    this._operationLocked.set(false);
    this._operationExpired.set(false);
    this.stopExchangeClock();
  }

  stopExchangeClock(): void {
    this.refreshSub?.unsubscribe();
    this.countdownSub?.unsubscribe();
    this.refreshSub = undefined;
    this.countdownSub = undefined;
  }

  private listenConnectionChanges(): void {

    // `takeUntilDestroyed` porque el store se provee en la ruta: cada entrada dejaba dos listeners colgados de window.
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(takeUntilDestroyed()).subscribe(() => {

      if (navigator.onLine && this.refreshSeconds() === 0 && this.step() < 3) {

        const table = this._table();
        if (!table || this._operationLocked()) return;

        this.exchangeService.getOne().subscribe(rate => {
          this.setTable({
            ...table,
            exchangeRate: rate
          });

          this.refreshSeconds.set(this.DEFAULT_REFRESH);
        });
      }

    });
  }

  hardReset(): void {
    this.stopExchangeClock();

    // El reloj se reanuda tras la ida y vuelta al API; sin esto el rotulo se queda congelado en la hora vieja.
    this.now.set(new Date());

    this.clearCotizacion();
    this._quote.set(null);
    this._accounts.set(null);
    this._transfer.set(null);
    this._voucher.set(null);
    this._coupon.set(null);
    this._legalRep.set(null);
    this._inputChange.set('USD');

    this._operationLocked.set(false);
    this._operationExpired.set(false);
    this._step.set(1);

    this.refreshSeconds.set(this.DEFAULT_REFRESH);

    const table = this._table();
    if (!table || this._operationLocked()) return;

    this.exchangeService.getOne().subscribe(rate => {
      this.setTable({
        ...table,
        exchangeRate: rate
      });

      this.resetQuoteForm();

      this.startExchangeClock();
    });
  }


  resetQuoteForm(): void {
    const form = this._quoteForm();
    const table = this._table();

    if (!form || !table) return;

    form.reset();

    form.setControl('operationType', new FormControl<'BUY' | 'SELL'>('BUY'));

    form.setControl(
      'amountUsd',
      new FormControl(1000, [
        Validators.required,
        Validators.min(table.company.minAmount),
        Validators.max(table.company.maxAmount),
      ])
    );

    form.setControl(
      'amountPen',
      new FormControl(0, Validators.required)
    );

    form.setControl('coupon', new FormControl(null));
    form.setControl('couponCode', new FormControl(null));

    form.setControl(
      'baseRate',
      new FormGroup({
        priceCompra: new FormControl(table.exchangeRate.priceCompra),
        priceVenta: new FormControl(table.exchangeRate.priceVenta),
      })
    );

    form.setControl(
      'effectiveRate',
      new FormGroup({
        priceCompra: new FormControl(table.exchangeRate.priceCompra),
        priceVenta: new FormControl(table.exchangeRate.priceVenta),
      })
    );

    queueMicrotask(() => {
      const rate = table.exchangeRate.priceCompra;
      form.get('amountPen')?.setValue(
        Number((1000 * rate).toFixed(2)),
        { emitEvent: false }
      );
    });
  }

}
