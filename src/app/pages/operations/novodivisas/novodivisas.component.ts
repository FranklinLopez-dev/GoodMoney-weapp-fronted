import { Component, computed, inject, OnInit, ViewChild } from "@angular/core";
import { NovodivisasStore } from "./novodivisas.store";
import { SimulationSectionComponent } from "./sections/simulation-section/simulation-section.component";
import { ProfileSectionComponent } from "./sections/profile-section/profile-section.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ProfileDetailComponent } from "./sections/profile-section/details/profile-details.component";
import { mapDocumentToValidatable } from "src/app/utils/document.util";
import { DynamicValidatorsService } from "src/app/shared/services/dynamic-validators.service";
import { DestinationSplit, ProfileBanks } from "src/app/core/models";
import { AccountsSectionComponent } from "./sections/accounts-section/accounts-section.component";
import { MaterialModule } from "src/app/material.module";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "src/app/shared/components/confirm-dialog/confirm-dialog.component";
import { OperationsService } from "../operations.service";
import { ToastrService } from "ngx-toastr";
import { DetailsNovodivisasComponent } from "./details/details.component";

@Component({
  standalone: true,
  selector: 'app-novodivisas',
  imports: [
    SimulationSectionComponent,
    ProfileSectionComponent,
    ProfileDetailComponent,
    AccountsSectionComponent,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './novodivisas.component.html'
})
export class NovodivisasComponent implements OnInit {

  @ViewChild('profileSection')
  profileSectionComponent!: ProfileSectionComponent;

  private fb = inject(FormBuilder);
  public store = inject(NovodivisasStore);
  public service = inject(OperationsService);
  private toastr = inject(ToastrService);
  public validatorsService = inject(DynamicValidatorsService);
  readonly table = computed(() => this.store.table());
  mode = computed(() => this.store.mode());
  profile = this.store.profile;
  isSaving = false;
  readonly dialog = inject(MatDialog);

  form!: FormGroup;
  private defaultFormValue!: any;
  private requestId: string | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      simulation: this.fb.group({
        exchange: ['1', Validators.required],   // BUY | SELL
        typeOperation: ['BUY', Validators.required],   // BUY | SELL
        documentType: ['03', Validators.required], // BOLETA | FACTURA
        amountUsd: [1000, [Validators.required, Validators.min(1)]],
        amountPen: [0, [Validators.required]],
        exchangeRate: [this.table()?.exchangeRate.priceCompra, [Validators.required, Validators.min(0.1)]],
      }),

      profile: this.fb.group({
        documentTypeId: [null, Validators.required],
        documentNumber: [null, Validators.required],
        names: [null, Validators.required],
        lastNames: [null],
        address: [null, Validators.required],
        issueDate: [new Date(), Validators.required],
        origenFondos: [null],
        paymentConditionId: [this.table()?.paymentConditions.find(p => p.isDefault)?.id ?? null, Validators.required],
      }),
      accounts: this.fb.group({
        originAccount: this.fb.control<ProfileBanks | null>(null),
        destinationAccounts: this.fb.control<DestinationSplit[]>([]),
        receiveByParts: [false]
      }),
      isSuspicious: [false],
    });

    const docTypeCtrl = this.form.get('profile.documentTypeId') as FormControl;
    const docNumberCtrl = this.form.get('profile.documentNumber') as FormControl;
    const defaultType = this.table()?.documentTypes.find(d => d.code === '1') || null;
    docTypeCtrl.setValue(defaultType?.id ?? null);
    this.validatorsService.applyValidators(
      docNumberCtrl,
      mapDocumentToValidatable(defaultType)
    );
    this.store.setForm(this.form);
    this.defaultFormValue = structuredClone(this.form.getRawValue());
  }

  focusDocumentNumber(): void {
    this.profileSectionComponent?.focusDocumentInput();
  }

  get controlQuote() {
    return this.form.get('simulation') as FormGroup;
  }

  get controlProfile() {
    return this.form.get('profile') as FormGroup;
  }

  get controlAccounts() {
    return this.form.get('accounts') as FormGroup;
  }

  readonly isSplitInvalid = () => {
    if (!this.controlAccounts.value.receiveByParts) return false;
    return this.difference() !== 0;
  };

  readonly difference = () => {
    return +(this.getTotalToReceive() - this.getUsdAmount());
  };

  getTotalToReceive(): number {
    const q = this.controlQuote.value;
    if (!q) return 0;

    return q.typeOperation === 'BUY'
      ? q.amountPen
      : q.amountUsd;
  }

  getUsdAmount(): number {
    return (this.controlAccounts.value.destinationAccounts ?? [])
      .reduce((sum: number, d: DestinationSplit) => sum + d.amount, 0);
  }


  save() {
    if (this.form.invalid || this.isSplitInvalid()) {
      return;
    }
    if (this.isSaving) return;
    this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Confirmar operación',
        message: this.profile()?.isBlackListed ? 'Este perfil se encuentra en la lista negra, seguro que desea confirmar la operación' : 'Seguro que desea confirmar la operación.',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        color: 'primary'
      }
    })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm || this.isSaving) return;
        this.initRequestId();
        this.isSaving = true;
        const payload = this.buildOperationPayload();

        this.service.saveAdmi(payload)
          .subscribe({
            next: (response) => {
              let respuesta = JSON.parse(response);
              this.isSaving = false;
              if (respuesta.success) {

                this.toastr.success("Operación guardada correctamente", "Éxito");

                this.dialog.open(DetailsNovodivisasComponent, {
                  disableClose: true,
                  data: {
                    respuesta: respuesta,
                    profile: this.profile()
                  }
                });

                this.clear();

              } else {
                this.toastr.warning(respuesta.data.qr, "Advertencia");
                this.clear();
              }
            },
            error: () => {
              this.isSaving = false;
            }
          });

      });
  }

  private buildOperationPayload(): any {

    const isBuy = this.controlQuote.value.typeOperation === 'BUY';

    let companyBank;
    try {
      companyBank = this.resolveCompanyBankFromOrigin();
    } catch (e: any) {
      this.toastr.warning(e.message, 'Advertencia');
      return;
    }

    return {
      typeOperation: isBuy ? '1' : '2',
      monto: this.controlQuote.value.amountUsd,
      tipoCambio: this.controlQuote.value.exchangeRate,
      total: this.controlQuote.value.amountPen,
      profileBankClient1Id: this.controlAccounts.value.originAccount.id,
      operationBanks: this.controlAccounts.value.destinationAccounts.map((d: any) => ({
        profileBankClient2Id: d.account.id,
        amount: d.amount
      })),
      isRecordedForSBS: this.controlQuote.value.amountUsd >= 5000,
      paymentConditionId: this.controlProfile.value.paymentConditionId,
      origenFondo: this.controlProfile.value.origenFondos ?? null,
      typeMpodera: 1,
      flagEnvio: false,
      couponId: 0,
      discount: 0,
      eProfileId: this.profile()?.id,
      typeDocu: this.controlQuote.value.documentType,
      issueDate: this.controlProfile.value.issueDate,
      companyBankId: companyBank.id,
      requestId: this.requestId,
    };
  }

  initRequestId() {
    if (!this.requestId) {
      this.requestId = crypto.randomUUID();
    }
  }

  private resolveCompanyBankFromOrigin() {

    const origin = this.controlAccounts.value.originAccount;
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

  clear(): void {
    this.form.reset(this.defaultFormValue);
    this.controlQuote.get('amountUsd')?.setValue(1000);

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.store.clearProfile();
    this.store.clearBankAccounts();
    this.requestId = null;
  }

  ngOnDestroy(): void {
    // Resetear completamente cuando el componente se destruye
    this.store.clearAll();
  }

}
