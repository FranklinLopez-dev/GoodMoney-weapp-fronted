import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { OperationCreateStore } from '../../store/operation-create.store';
import { CouponsService } from 'src/app/pages/settings/coupons/coupons.service';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { HorarioService } from 'src/app/core/services/common/horario.service';
import { AmountInputDirective } from 'src/app/shared/directives/amount-input.directive';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';
import { BlockingModalData } from '../../blocking-modal/blocking-modal.models';
import { BlockingModalComponent } from '../../blocking-modal/blocking-modal.component';
import { finalize } from 'rxjs';
import { Cotizacion, OperationsService } from '../../../operations.service';

@Component({
  selector: 'app-quote-step',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TablerIconsModule, AmountInputDirective],
  templateUrl: './quote-step.component.html',
  styleUrls: ['./quote-step.component.scss']
})
export class QuoteStepComponent implements OnInit, OnDestroy {

  @Input({ required: true }) form!: FormGroup;
  @Output() next = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private store = inject(OperationCreateStore);
  private couponService = inject(CouponsService);
  private banksAccountsService = inject(BanksAccountsService);
  private operationsService = inject(OperationsService);
  private dialog = inject(MatDialog);

  /** Para avisar si se cotiza con la oficina cerrada. */
  private horario = inject(HorarioService);

  isLoading = signal(false);
  private calculationsBound = false;
  private subscriptions: Subscription[] = [];

  readonly table = this.store.table;
  readonly refreshTime = this.store.refreshTime;

  /* Mismo estimado que la web pública (SAVING_PER_USD en main.js): 0.154 soles por dólar. */
  private readonly ahorroPorUsd = 0.154;
  ahorroEstimado(): number {
    return (Number(this.form?.value?.amountUsd) || 0) * this.ahorroPorUsd;
  }
  private openedBlockModal = false;
  private inputChange = this.store.inputChange;

  ngOnInit(): void {
    this.initFormControls();
    this.bindCalculations();
    this.store.setQuoteForm(this.form);
    this.store.startExchangeClock();
    this.openBlockingModalIfNeeded();
  }

  private initFormControls(): void {
    if (this.form.contains('operationType')) return;

    this.form.addControl('operationType', this.fb.control<'BUY' | 'SELL'>('BUY'));
    this.form.addControl('amountUsd', this.fb.control(1000, [
      Validators.required,
      Validators.min(this.table()?.company?.minAmount!),
      Validators.max(this.table()?.company?.maxAmount!),
    ]));
    this.form.addControl('amountPen', this.fb.control(0, Validators.required));
    this.form.addControl('coupon', this.fb.control(null));
    this.form.addControl('couponCode', this.fb.control(null));

    this.form.addControl('baseRate', this.fb.group({
      priceCompra: [this.table()?.exchangeRate.priceCompra],
      priceVenta: [this.table()?.exchangeRate.priceVenta],
    }));

    this.form.addControl('effectiveRate', this.fb.group({
      priceCompra: [this.table()?.exchangeRate.priceCompra],
      priceVenta: [this.table()?.exchangeRate.priceVenta],
    }));

    queueMicrotask(() => {
      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd();
      } else {
        this.recalculateFromPen();
      }
    })

  }

  get control() {
    return this.form.controls;
  }

  private bindCalculations(): void {
    if (this.calculationsBound) return;
    this.calculationsBound = true;

    const sub1 = this.form.get('amountUsd')!.valueChanges.subscribe((value) => {
      this.store.setInputChage('USD');
      this.recalculateFromUsd(value);
    });

    const sub2 = this.form.get('amountPen')!.valueChanges.subscribe((value) => {
      this.store.setInputChage('PEN');
      this.recalculateFromPen(value);
    });

    this.subscriptions.push(sub1, sub2);
  }

  private recalculateFromUsd(value?: number): void {
    const type = this.form.value.operationType;
    const rate = type === 'BUY'
      ? this.form.value.effectiveRate.priceCompra
      : this.form.value.effectiveRate.priceVenta;

    const pen = Number(value ?? this.form.value.amountUsd) * rate;
    this.form.get('amountPen')!.setValue(this.round(pen), { emitEvent: false });
  }

  private recalculateFromPen(value?: number): void {
    const type = this.form.value.operationType;
    const rate = type === 'BUY'
      ? this.form.value.effectiveRate.priceCompra
      : this.form.value.effectiveRate.priceVenta;

    const usd = Number(value ?? this.form.value.amountPen) / rate;
    this.form.get('amountUsd')!.setValue(this.round(usd), { emitEvent: false });
  }

  applyCoupon(): void {
    const code = this.form.value.couponCode;
    if (!code) return;

    const sub = this.couponService.getCouponsCode(code).subscribe(coupon => {
      this.form.get('coupon')!.setValue(coupon);
      this.form.patchValue({
        effectiveRate: this.applyCouponToRate(this.form.value.baseRate),
      }, { emitEvent: false });

      if (this.inputChange() == 'USD') {
        this.recalculateFromUsd();
      } else {
        this.recalculateFromPen();
      }
    });

    this.subscriptions.push(sub);
  }

  removeCoupon(): void {
    this.form.get('coupon')!.setValue(null);
    this.form.get('couponCode')!.setValue(null);
    this.form.patchValue({
      effectiveRate: this.form.value.baseRate,
    }, { emitEvent: false });

    if (this.inputChange() == 'USD') {
      this.recalculateFromUsd();
    } else {
      this.recalculateFromPen();
    }
  }

  swapAmounts(): void {
    const current = this.form.value.operationType;
    this.form.get('operationType')!.setValue(current === 'BUY' ? 'SELL' : 'BUY');
    if (this.inputChange() == 'USD') {
      this.recalculateFromUsd();
    } else {
      this.recalculateFromPen();
    }
  }

  continue(): void {
    if (this.form.invalid) return;

    // El cliente deposita creyendo que le llega en 15 minutos: si no hay nadie que se lo devuelva, ha de saberlo antes.
    if (this.horario.abierto() === false) {
      this.confirmarFueraDeHorario();
      return;
    }

    this.avanzar();
  }

  /** Aviso de fuera de horario: el cliente decide si continúa. */
  private confirmarFueraDeHorario(): void {
    const feriado = this.horario.feriado();

    const motivo = feriado
      ? `Hoy es feriado (${feriado}) y no hay atención.`
      : 'En este momento estamos fuera del horario de atención.';

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Fuera de horario',
        message: `${motivo} Puedes registrar tu operación igualmente, pero la validaremos ` +
                 'y te depositaremos cuando volvamos a abrir. ¿Quieres continuar?',
        confirmText: 'Continuar igualmente',
        cancelText: 'Mejor luego',
      },
    })
      .afterClosed()
      .subscribe(confirmado => {
        if (confirmado) this.avanzar();
      });
  }

  /**
   * Antes de pasar a las cuentas el servidor sella la cotización: fija el tipo de cambio (con el cupón), los
   * montos y hasta cuándo valen. La pantalla toma sus números, no los que calculó; y el refresco de la
   * pizarra ya no los mueve mientras dure la reserva.
   */
  private avanzar(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    const v = this.form.value;
    const input = this.inputChange() === 'PEN' ? 'PEN' : 'USD';

    this.operationsService.cotizar({
      typeOperation: v.operationType === 'BUY' ? '1' : '2',
      monto: Number(input === 'USD' ? v.amountUsd : v.amountPen),
      inputChange: input,
      couponId: v.coupon?.id ?? null,
    }).subscribe({
      next: c => {
        const rate = { ...this.form.value.effectiveRate };
        if (c.typeOperation === '1') rate.priceCompra = c.tasa; else rate.priceVenta = c.tasa;
        this.form.patchValue({ effectiveRate: rate, amountUsd: c.monto, amountPen: c.total }, { emitEvent: false });
        this.store.setQuote(this.form.value);
        this.continuarACuentas(c);
      },
      // El motivo (monto fuera de rango, cupón agotado, fuera de horario) lo muestra el interceptor.
      error: () => this.isLoading.set(false),
    });
  }

  /** La cotización se guarda recién al pasar de paso: si no se pasa, la calculadora sigue a la pizarra. */
  private continuarACuentas(c: Cotizacion): void {
    if (this.store.hasBankAccounts()) {
      this.isLoading.set(false);
      this.store.setCotizacion(c);
      this.next.emit();
      return;
    }

    this.banksAccountsService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: accounts => {
          this.store.setBankAccounts(accounts);
          this.store.setCotizacion(c);
          this.next.emit();
        },
        error: () => this.store.clearCotizacion(),
      });
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

  get blockedReasons(): string[] {
    const reasons: string[] = [];
    if (this.table()?.company.isMaintenance) {
      reasons.push('Sistema en mantenimiento');
    }
    if (this.table()?.isClosed) {
      reasons.push('Operaciones fuera de horario');
    }
    if (!this.table()?.eProfile?.isValidate) {
      reasons.push('Perfil en proceso de validación');
    }
    if (this.table()?.eProfile?.isBlackListed) {
      reasons.push('Usted no puede realizar operaciones, por favor comunicarse con nosotros');
    }
    return reasons;
  }

  get hasBlock(): boolean { return this.blockedReasons.length > 0; }

  private openBlockingModalIfNeeded(): void {
    if (this.openedBlockModal) return;

    const modalsQueue = this.buildBlockingModals();
    if (!modalsQueue.length) return;

    this.openedBlockModal = true;
    this.openNextModal(modalsQueue, 0);
  }

  private buildBlockingModals(): BlockingModalData[] {
    const table = this.table();
    if (!table) return [];

    const email = table.company.emailAdress;
    const phone = table.company.cellPhone;

    const modals: BlockingModalData[] = [];

    if (table.company.isMaintenance) {
      modals.push({
        kind: 'maintenance',
        title: 'Plataforma en mantenimiento',
        subtitle: 'Estamos realizando mejoras para brindarte un mejor servicio.',
        message: 'En este momento no es posible crear operaciones.',
        bullets: [
          'Puedes revisar el tipo de cambio y preparar tu operación.',
          'Vuelve a intentarlo en unos minutos.'
        ],
        footerNote: 'Gracias por tu comprensión.',
        primaryText: 'Entendido',
        showClose: true,
      });
    }

    if (table.isClosed) {
      modals.push({
        kind: 'closed',
        title: 'Operaciones fuera de horario',
        subtitle: 'Puedes cotizar, pero no continuar la operación.',
        message: 'Nuestro horario de atención es:',
        bullets: [
          'Lunes a Viernes: 9:00 a.m. – 6:00 p.m.',
          'Sábados: 9:00 a.m. – 1:00 p.m.'
        ],
        footerNote: 'Los tiempos de atención aplican dentro del horario.',
        primaryText: 'Entendido',
        showClose: true,
      });
    }

    if (!table.eProfile?.isValidate) {
      modals.push({
        kind: 'profile',
        title: 'Perfil en proceso de validación',
        subtitle: 'Tu información se encuentra en revisión.',
        message: 'Para acelerar el proceso o resolver dudas, contáctanos:',
        bullets: [
          `Correo: ${email}`,
          `WhatsApp: ${phone}`
        ],
        footerNote: 'Te avisaremos cuando tu perfil esté validado.',
        primaryText: 'Entendido',
        showClose: true,
      });
    }

    if (table.eProfile?.isBlackListed) {
      modals.push({
        kind: 'profile',
        title: 'Perfil no puede operar',
        subtitle: 'Tu cuenta se encuentra bloqueada.',
        message: 'Para acelerar el proceso o resolver dudas, contáctanos:',
        bullets: [
          `Correo: ${email}`,
          `WhatsApp: ${phone}`
        ],
        footerNote: 'Te avisaremos cuando tu perfil esté validado.',
        primaryText: 'Entendido',
        showClose: true,
      });
    }

    return modals;
  }

  private openNextModal(modals: BlockingModalData[], index: number): void {
    if (index >= modals.length) return;

    const dialogRef = this.dialog.open(BlockingModalComponent, {
      data: modals[index],
      panelClass: ['bm-dialog'],
      maxWidth: '560px',
      autoFocus: false,
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.openNextModal(modals, index + 1);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
