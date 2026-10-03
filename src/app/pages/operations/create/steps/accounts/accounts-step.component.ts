import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  signal,
  DestroyRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { nuevoUuid } from "src/app/shared/utils/identificadores";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { DestinationSplit, ProfileBanks } from "src/app/core/models";
import { OperationCreateStore } from "../../store/operation-create.store";
import { FullComponent } from "src/app/layouts/full/full.component";
import { MaterialModule } from "src/app/material.module";
import { TablerIconsModule } from "angular-tabler-icons";
import { MatDialog } from "@angular/material/dialog";
import { EditAmountDialogComponent } from "./edit-amount/edit-amount-dialog.component";
import { ConfirmDialogComponent } from "src/app/shared/components/confirm-dialog/confirm-dialog.component";
import { SbsInfoDialogComponent } from "./sbs-info/sbs-info-dialog.component";
import { AccountModalComponent } from "src/app/pages/bank-accounts/personal/personal-account.component";
import { UtilsService } from "src/app/core/services/common/utils.service";
import { BanksAccountsService } from "src/app/pages/bank-accounts/bank-accounts.service";
import { finalize } from "rxjs";
import { OperationsService, RequisitoSbs } from "../../../operations.service";
import { ToastrService } from "ngx-toastr";
import { FallbackImgDirective } from "src/app/shared/directives/fallback-img.directive";
import { TermsDialogComponent } from "src/app/pages/authentication/register/terms/terms-dialog.component";

@Component({
  selector: 'app-accounts-step',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
  templateUrl: './accounts-step.component.html',
  styleUrls: ['./accounts-step.component.scss'],
})
export class AccountsStepComponent implements OnInit, OnDestroy {

  @Input({ required: true }) form!: FormGroup;
  @Output() next = new EventEmitter<void>();

  readonly store = inject(OperationCreateStore);
  readonly service = inject(OperationsService);
  readonly layout = inject(FullComponent);
  readonly dialog = inject(MatDialog);
  private appData = inject(UtilsService);

  /**
   * Una por intento de registro, y la misma si se reintenta: si la red se cortó después de guardar,
   * el servidor devuelve la operación ya creada en vez de registrar otra. Se renueva al lograrlo.
   */
  private requestId: string | null = null;
  readonly recotizando = signal(false);
  private destroyRef = inject(DestroyRef);
  private banksAccountsService = inject(BanksAccountsService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  isSaving = false;

  readonly origenFondosList = [
    { id: '001:AHORROS', name: 'AHORROS' },
    { id: '002:ALQUILER DE BIENES MUEBLES', name: 'ALQUILER DE BIENES MUEBLES' },
    { id: '003:ALQUILER DE BIENES INMUEBLES', name: 'ALQUILER DE BIENES INMUEBLES' },
    { id: '004:DONACION / SORTEO', name: 'DONACION / SORTEO' },
    { id: '005:INGRESOS POR TRABAJO INDEPENDIENTE', name: 'INGRESOS POR TRABAJO INDEPENDIENTE' },
    { id: '006:INGRESOS POR TRABAJO DEPENDIENTE', name: 'INGRESOS POR TRABAJO DEPENDIENTE' },
    { id: '007:INGRESOS POR REGALIA', name: 'INGRESOS POR REGALIA' },
    { id: '008:PRESTAMOS', name: 'PRESTAMOS' },
    { id: '009:VENTA DE BIEN MUEBLE', name: 'VENTA DE BIEN MUEBLE' },
    { id: '010:VENTA DE BIEN INMUEBLE', name: 'VENTA DE BIEN INMUEBLE' },
    { id: '099:OTROS', name: 'OTROS' }
  ];

  readonly quote = computed(() => this.store.quote());
  readonly accounts = this.store.bankAccounts;
  readonly refreshTime = this.store.refreshTime;
  readonly table = this.store.table;
  isLoading = signal(false);
  readonly consultandoSbs = signal(false);

  @ViewChild('originDrawer', { static: true })
  originDrawer!: TemplateRef<any>;

  @ViewChild('destinationDrawer', { static: true })
  destinationDrawer!: TemplateRef<any>;

  tempOriginAccount: ProfileBanks | null = null;
  tempDestinationAccounts: ProfileBanks[] = [];
  editingDestinationIndex: number | null = null;


  ngOnInit(): void {
    this.initFormControls();
    this.initDefaultsIfNeeded();
    this.listenReceiveByParts();
    // Otras cuentas, otro pedido: si cambió algo, el reintento ya no es "el mismo" y lleva id nuevo.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.requestId = null);
  }

  ngOnDestroy(): void {
    this.tempOriginAccount = null;
    this.editingDestinationIndex = null;
    this.tempDestinationAccounts = [];
    this.layout.closeGlobalDrawer();
  }


  private initFormControls(): void {

    if (!this.form.contains('originAccount')) {
      this.form.addControl(
        'originAccount',
        this.fb.control<ProfileBanks | null>(null)
      );
    } else { this.form.get('originAccount')?.reset(); }

    if (!this.form.contains('destinationAccounts')) {
      this.form.addControl(
        'destinationAccounts',
        this.fb.control<DestinationSplit[]>([])
      );
    } else { this.form.get('destinationAccounts')?.reset(); }

    if (!this.form.contains('receiveByParts')) {
      this.form.addControl(
        'receiveByParts',
        this.fb.control<boolean>(false)
      );
    } else { this.form.get('receiveByParts')?.reset(false); }

    if (!this.form.contains('acceptTerms')) {
      this.form.addControl(
        'acceptTerms',
        this.fb.control<boolean>(false)
      );
    } else { this.form.get('acceptTerms')?.reset(false); }

    if (!this.form.contains('origenFondo')) {
      this.form.addControl(
        'origenFondo',
        this.fb.control<string | null>(null, Validators.required)
      );
    } else {
      this.form.get('origenFondo')?.setValidators(Validators.required);
      this.form.get('origenFondo')?.updateValueAndValidity();
    }
  }

  abrirTerminos(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const ref = this.dialog.open(TermsDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false
    });

    ref.afterClosed().subscribe(aceptado => {
      if (aceptado) this.form.get('acceptTerms')?.setValue(true);
    });
  }


  private listenReceiveByParts(): void {
    this.form.get('receiveByParts')?.valueChanges.subscribe(enabled => {

      if (!enabled) {
        const dest =
          this.destinationAccounts().find(a => a.isCheck)
          ?? this.destinationAccounts()[0];

        if (dest) {
          this.form.get('destinationAccounts')!.setValue([
            {
              account: dest,
              amount: this.getTotalToReceive()
            }
          ]);
        }
      }

    });
  }


  readonly originAccounts = computed(() => {
    const list = this.accounts() ?? [];
    const type = this.quote()?.operationType;

    return list.filter(a =>
      a.isMe &&
      (type === 'BUY' ? a.coinId === 'USD' : a.coinId === 'PEN')
    );
  });

  readonly destinationAccounts = computed(() => {
    const list = this.accounts() ?? [];
    const type = this.quote()?.operationType;

    return list.filter(a =>
      type === 'BUY' ? a.coinId === 'PEN' : a.coinId === 'USD'
    );
  });


  private initDefaultsIfNeeded(): void {

    if (!this.form.value.originAccount) {
      const origin =
        this.originAccounts().find(a => a.isCheck)
        ?? this.originAccounts()[0];

      if (origin) {
        this.form.get('originAccount')!.setValue(origin);
      }
    }

    if (!this.form.value.destinationAccounts?.length) {
      const dest =
        this.destinationAccounts().find(a => a.isCheck)
        ?? this.destinationAccounts()[0];

      if (dest) {
        this.form.get('destinationAccounts')!.setValue([
          {
            account: dest,
            amount: this.getTotalToReceive()
          }
        ]);
      }
    }
  }


  getTotalToReceive(): number {
    const q = this.quote();
    if (!q) return 0;

    return q.operationType === 'BUY'
      ? q.amountPen
      : q.amountUsd;
  }

  getUsdAmount(): number {
    return (this.form.value.destinationAccounts ?? [])
      .reduce((sum: number, d: DestinationSplit) => sum + d.amount, 0);
  }

  canSelectMultiple(): boolean {
    return !!this.store.table()?.company?.isOneAccount
      && !!this.form.value.receiveByParts;
  }


  openDestinationReplace(index: number): void {
    this.editingDestinationIndex = index;

    this.tempDestinationAccounts = [];

    this.layout.openGlobalDrawer(this.destinationDrawer);
  }

  destinationAdd(): void {
    this.editingDestinationIndex = null;
    this.tempDestinationAccounts = [];
    this.layout.openGlobalDrawer(this.destinationDrawer);
  }

  openDrawer(): void {
    this.tempOriginAccount = null;
    this.layout.openGlobalDrawer(this.originDrawer);
  }

  isCurrentOrigin(acc: ProfileBanks): boolean {
    return this.form.value.originAccount?.id === acc.id;
  }

  selectTempOrigin(account: ProfileBanks): void {
    this.tempOriginAccount = account;
  }

  confirmOrigin(): void {
    if (!this.tempOriginAccount) return;

    this.form.get('originAccount')!.setValue(this.tempOriginAccount);
    this.layout.closeGlobalDrawer();
  }

  confirmDestination(): void {
    if (!this.tempDestinationAccounts.length) return;

    const selected = this.tempDestinationAccounts[0];
    const list: DestinationSplit[] = [...this.form.value.destinationAccounts];

    if (this.editingDestinationIndex !== null) {

      const current = list[this.editingDestinationIndex];

      list[this.editingDestinationIndex] = {
        account: selected,
        amount: current.amount
      };

      this.form.get('destinationAccounts')!.setValue(list);
    } else {

      const total = this.getTotalToReceive();
      const usd = this.getUsdAmount();
      const remaining = total - usd;

      if (remaining <= 0) return;

      if (!this.form.value.destinationAccounts.length) {
        this.form.get('destinationAccounts')!.setValue([
          { account: selected, amount: total }
        ]);
        this.layout.closeGlobalDrawer();
        return;
      }

      this.openEditAmountModal(
        remaining,
        remaining,
        selected.bankName,
        this.getDisplayAccount(selected),
        (amount) => {
          this.form.get('destinationAccounts')!.setValue([
            ...list,
            { account: selected, amount }
          ]);
        }
      );
    }

    this.editingDestinationIndex = null;
    this.tempDestinationAccounts = [];
    this.layout.closeGlobalDrawer();
  }


  editAmount(dest: DestinationSplit): void {
    const total = this.getTotalToReceive();
    const usedWithoutCurrent =
      this.getUsdAmount() - dest.amount;

    const max = total - usedWithoutCurrent;

    this.openEditAmountModal(
      dest.amount,
      max,
      dest.account.bankName,
      this.getDisplayAccount(dest.account),
      (amount) => {
        const updated = (this.form.value.destinationAccounts ?? [])
          .map((d: any) =>
            d.account.id === dest.account.id
              ? { ...d, amount }
              : d
          );

        this.form.get('destinationAccounts')!.setValue(updated);
      }
    );
  }

  openEditAmountModal(
    initial: number,
    max: number,
    banco: string,
    accountNumber: string,
    onSave: (value: number) => void
  ): void {

    const currency =
      this.quote()?.operationType === 'BUY' ? 'PEN' : 'USD';

    this.dialog.open(EditAmountDialogComponent, {
      width: '360px',
      data: {
        title: 'Editar monto a recibir',
        currency,
        initialAmount: initial,
        maxAmount: max,
        banco: banco,
        accountNumber: accountNumber
      }
    })
      .afterClosed()
      .subscribe(result => {
        if (typeof result === 'number') {
          onSave(result);
        }
      });
  }


  /** Vuelve a sellar la cotización con los mismos datos sin salir de este paso (las cuentas se conservan). */
  recotizar(despues?: () => void): void {
    const c = this.store.cotizacion();
    if (!c || this.recotizando()) return;
    this.recotizando.set(true);
    this.service.cotizar({
      typeOperation: c.typeOperation,
      monto: c.inputChange === 'PEN' ? c.total : c.monto,
      inputChange: c.inputChange,
      couponId: c.couponId,
    })
      .pipe(finalize(() => this.recotizando.set(false)))
      .subscribe({
        next: nueva => {
          const q = structuredClone(this.store.quote());
          const rate = { ...q.effectiveRate };
          if (nueva.typeOperation === '1') rate.priceCompra = nueva.tasa; else rate.priceVenta = nueva.tasa;
          this.store.setQuote({ ...q, effectiveRate: rate, amountUsd: nueva.monto, amountPen: nueva.total });
          this.store.setCotizacion(nueva);
          if (nueva.tasa !== c.tasa)
            this.toastr.info(`El tipo de cambio ahora es ${nueva.tasa}. Revisa los montos antes de continuar.`, 'Cotización renovada');
          else if (despues) despues();
        },
        // Si ya no se puede (fuera de horario, cupón agotado): a "Cotiza".
        error: () => this.store.setStep(1),
      });
  }

  continue(): void {
    // Con poca reserva, se renueva antes de empezar: la declaración jurada puede tomar minutos y, si vence en
    // medio, se perdería lo llenado.
    const c = this.store.cotizacion();
    if (c && this.store.segundosDeReserva() < 90) {
      this.recotizar(() => this.continue());
      return;
    }

    if (this.form.get('origenFondo')?.invalid) {
      this.form.get('origenFondo')?.markAsTouched();
      this.toastr.warning('Selecciona el origen de los fondos', 'Revisa la operacion');
      return;
    }

    // Red de seguridad: el boton ya se deshabilita si no cuadra (ver `isSplitInvalid`), pero nunca se sale en silencio.
    if (this.isSplitInvalid()) {
      this.toastr.warning(this.getSplitMessage(), 'Revisa los importes');
      return;
    }

    this.store.setAccounts(this.form.value);

    // Si la operación entra al Registro de Operaciones hace falta la declaración jurada SBS. Lo decide
    // el servidor con los umbrales del RO (antes se adivinaba aquí con el límite comercial del mes).
    // Su propia bandera y no `isLoading`: `openConfirmDialog` no abre mientras `isLoading` esté
    // arriba, y el `finalize` corre después del `next`.
    if (this.consultandoSbs()) return;
    this.consultandoSbs.set(true);
    this.service.requisitoSbs(this.quote().amountUsd)
      .subscribe({
        next: r => {
          this.consultandoSbs.set(false);
          if (r.requiereDj) this.openSbsForm(r);
          else if (r.requiereDeclaracionPep) this.openSbsForm(r, true);
          else this.openConfirmDialog(null);
        },
        // Si no se pudo consultar, se sigue: el servidor lo vuelve a comprobar al registrar.
        error: () => {
          this.consultandoSbs.set(false);
          this.openConfirmDialog(null);
        },
      });
  }

  /** `soloPep`: solo renovar la declaración PEP vencida (sin la declaración jurada completa). */
  openSbsForm(requisito: RequisitoSbs, soloPep = false): void {

    this.dialog.open(SbsInfoDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { requisito, soloPep },
    })
      .afterClosed()
      .subscribe(result => {
        if (!result) return;


        this.openConfirmDialog(result);
      });
  }

  openConfirmDialog(result: any): void {
    if (this.isLoading()) return;
    const minutes = this.store.table()?.company.operationTime ?? 0;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Confirmar operación',
        message:
          `Al confirmar la operación, debe realizar la transferencia y confirmarla. 
         Recuerde que tendrá ${minutes} minutos para completar el proceso.`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        color: 'primary'
      }
    });

    dialogRef.afterClosed()
      .subscribe(confirm => {
        if (!confirm || this.isLoading()) return;

        this.store.setAccounts(this.form.value);
        this.requestId ??= nuevoUuid();
        const payload = { ...this.buildOperationPayload(result), requestId: this.requestId, cotizacionId: this.store.cotizacion()?.id ?? null };

        this.isLoading.set(true);

        this.service.save(payload)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              if (!Number(response)) {
                // El servidor pidió la declaración jurada que la pantalla no pidió (p. ej. el mes cruzó
                // el umbral con otra operación entre tanto): se abre el formulario en vez de repetir el aviso.
                if (!result?.declaracionPep && !result?.declaracionSbs && String(response).includes('declaración PEP')) {
                  this.openSbsForm({
                    requiereDj: false, motivo: null, cubiertaPorMes: false,
                    umbralIndividualUsd: 0, umbralAcumuladoUsd: 0, acumuladoMesUsd: 0, requiereDeclaracionPep: true,
                  }, true);
                  return;
                }
                if (!result?.declaracionSbs && String(response).includes('declaración jurada')) {
                  this.openSbsForm({
                    requiereDj: true, motivo: null, cubiertaPorMes: false,
                    umbralIndividualUsd: 0, umbralAcumuladoUsd: 0, acumuladoMesUsd: 0,
                  });
                  return;
                }
                this.toastr.warning(response, "Advertencia");
                // La cotización venció, ya se usó o su cupón se agotó: se vuelve a "Cotiza" para sellar otra.
                if (/vuelve a cotizar/i.test(String(response))) this.store.setStep(1);
                return;
              }

              let companyBank;
              try {
                companyBank = this.resolveCompanyBankFromOrigin();
              } catch (e: any) {
                this.toastr.warning(e.message, 'Advertencia');
                return;
              }

              this.store.setTransfer({
                operationId: response.padStart(8, 0),
                companyBank: companyBank
              });

              this.toastr.success(
                "Operación guardada correctamente",
                "Éxito"
              );

              this.requestId = null;
              this.next.emit();

            }
          });

      });
  }

  private buildOperationPayload(result: any): any {

    const isBuy = this.quote().operationType === 'BUY';

    const paymentConditionId =
      this.table()?.paymentConditions?.find(p => p.isDefault)?.id ?? 0;

    const coupon = this.quote().coupon;

    return {
      typeOperation: isBuy ? '1' : '2',
      monto: this.quote().amountUsd,
      tipoCambio: isBuy
        ? this.quote().effectiveRate.priceCompra
        : this.quote().effectiveRate.priceVenta,
      total: this.quote().amountPen,
      profileBankClient1Id: this.form.value.originAccount.id,

      operationBanks: this.form.value.destinationAccounts.map((d: any) => ({
        profileBankClient2Id: d.account.id,
        amount: d.amount
      })),
      flagEnvio: false,
      couponId: coupon ? coupon.id : 0,
      discount: coupon ? coupon.discount : 0,
      paymentConditionId,
      origenFondo: result?.origenFondos ?? this.form.value.origenFondo ?? null,
      declaracionSbs: result?.declaracionSbs ?? null,
      declaracionPep: result?.declaracionPep ?? null,
      inputChange: this.store.inputChange()
    };
  }

  private resolveCompanyBankFromOrigin() {

    const origin = this.store.accounts()?.originAccount;
    const companyBanks = this.store.table()?.companyBanks ?? [];

    const sameBank = companyBanks.find(cb =>
      cb.bankId === origin.bankId &&
      cb.coinCode === origin.coinId
    );

    if (sameBank) return sameBank;

    const interbank = companyBanks.find(cb =>
      cb.coinCode === origin.coinId &&
      cb.flagInter === true
    );

    if (interbank) return interbank;

    throw new Error(
      `La empresa no tiene cuenta para recibir ${origin.coinId}`
    );

  }

getDisplayAccount(account: any): string {
    if (!account) return 'Seleccionar cuenta de banco';
    const isValid = (v?: string) => !!v && !/^0+$/.test(v);
    if (isValid(account.accountNumber)) {
      return 'Cuenta: ' + account.accountNumber;
    }
    if (isValid(account.accountNumberCci)) {
      return 'CCI:' + account.accountNumberCci;
    } return '';
  }

  isTempDestinationSelected(acc: ProfileBanks): boolean {
    return this.tempDestinationAccounts.some(a => a.id === acc.id);
  }

  isDestinationAlreadyAdded(acc: ProfileBanks): boolean {
    const list = this.form.value.destinationAccounts ?? [];
    return list.some((d: any) => d.account.id === acc.id);
  }

  selectDestination(account: ProfileBanks): void {

    if (this.canSelectMultiple()) {
      const exists = this.tempDestinationAccounts
        .some(a => a.id === account.id);

      this.tempDestinationAccounts = exists
        ? this.tempDestinationAccounts.filter(a => a.id !== account.id)
        : [...this.tempDestinationAccounts, account];

      return;
    }

    this.tempDestinationAccounts = [account];
  }

  removeDestination(index: number): void {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar cuenta',
        message: `¿Estás seguro que deseas eliminar esta cuenta`,
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (confirmed) => {
        if (!confirmed) return;

        const list = [...(this.form.value.destinationAccounts ?? [])];

        if (list.length <= 1) return;

        list.splice(index, 1);
        this.form.get('destinationAccounts')!.setValue(list);
      },
    });
  }

  readonly difference = () => {
    return +(this.getTotalToReceive() - this.getUsdAmount());
  };

  /** Se comprueba siempre y no solo al repartir: la cotizacion se refresca sola y `continue()` se salia en silencio. */
  readonly isSplitInvalid = () => {
    return Math.abs(this.difference()) > 0.005;
  };

  getSplitMessage(): string {
    const diff = this.difference();

    if (diff > 0) {
      return `Falta asignar ${this.getCurrencySymbol()} ${diff.toFixed(2)}`;
    }

    if (diff < 0) {
      return `Has excedido el monto en ${this.getCurrencySymbol()} ${Math.abs(diff).toFixed(2)}`;
    }

    return '';
  }

  getCurrencySymbol(): string {
    return this.quote()?.operationType === 'BUY' ? 'S/' : '$';
  }

  openOriginAdd(): void {
    const dialogRef = this.dialog.open(AccountModalComponent, {
      width: '720px',
      disableClose: true,
      data: {
        banks: this.table()?.banks,
        companyBanks: this.table()?.companyBanks,
        documentTypes: this.table()?.documentTypes.filter(d => d.isNatural),
        coinId: this.getOriginCoin(),
        mode: 'create',
        profile: this.appData.profile(),
        isNatural: this.appData.profile()?.documentTypeIsNatural
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.realoadProfileBanks();
    });
  }

  private getOriginCoin(): 'PEN' | 'USD' {
    return this.quote()?.operationType === 'BUY'
      ? 'USD'
      : 'PEN';
  }

  openDestinationAdd(): void {
    const dialogRef = this.dialog.open(AccountModalComponent, {
      width: '720px',
      disableClose: true,
      data: {
        banks: this.table()?.banks,
        companyBanks: this.table()?.companyBanks,
        documentTypes: this.table()?.documentTypes.filter(d => d.isNatural),
        coinId: this.getDestinationCoin(),
        mode: 'create',
        profile: this.appData.profile(),
        isNatural: this.appData.profile()?.documentTypeIsNatural
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.realoadProfileBanks();
    });
  }

  private getDestinationCoin(): 'PEN' | 'USD' {
    return this.quote()?.operationType === 'BUY'
      ? 'PEN'
      : 'USD';
  }

  private realoadProfileBanks(): void {
    this.isLoading.set(true);
    this.banksAccountsService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(accounts => {
        this.store.setBankAccounts(accounts);
      });
  }


}
