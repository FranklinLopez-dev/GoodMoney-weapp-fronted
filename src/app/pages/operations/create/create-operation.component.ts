import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { OperationCreateStore } from './store/operation-create.store';
import { QuoteStepComponent } from './steps/quote/quote-step.component';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { AccountsStepComponent } from './steps/accounts/accounts-step.component';
import { TransferStepComponent } from './steps/transfer/transfer-step.component';
import { ConfirmationStepComponent } from './steps/confirmation/confirmation-step.component';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterModule } from '@angular/router';

// Se construia un Intl.DateTimeFormat por segundo mientras la vista esta abierta; construirlo es lo caro, formatear no.
const FORMATO_FECHA_ES_PE = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

@Component({
  selector: 'app-create-operation',
  standalone: true,
  imports: [MaterialModule, RouterModule, ConfirmationStepComponent, QuoteStepComponent, FallbackImgDirective, AccountsStepComponent, TransferStepComponent, TablerIconsModule],
  templateUrl: './create-operation.component.html',
  styleUrls: ['./create-operation.component.scss'],
})
export class CreateOperationComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  public store = inject(OperationCreateStore);
  private appData = inject(UtilsService);

  readonly step = this.store.step;
  readonly loading = this.store.loading;

  /** Los cuatro pasos, tal cual los nombra el diseño. */
  // `anchoIcono`/`altoIcono` son el tamano real del .webp: evitan el salto de la franja al cargar (CLS).
  readonly pasos = [
    { numero: 1, titulo: 'Cotiza', icono: 'coin', anchoIcono: 32, altoIcono: 34 },
    { numero: 2, titulo: 'Registro', icono: 'file-text', anchoIcono: 30, altoIcono: 34 },
    { numero: 3, titulo: 'Transfiere', icono: 'cash', anchoIcono: 24, altoIcono: 34 },
    { numero: 4, titulo: 'Adjunta', icono: 'circle-check', anchoIcono: 28, altoIcono: 32 },
  ];
  success = signal(false);
  profile = this.appData.profile();
  readonly table = computed(() => this.store.table());

  readonly totalSteps = 4;

  /** Hora del rotulo "Dolar en Peru": sale del reloj unico del store. */
  readonly lastUpdate = computed(() => this.formatDate(this.store.now()));
  readonly isLastStep = computed(() => this.step() === this.totalSteps);

  operationForm: FormGroup = this.fb.group({
    quote: this.fb.group({}),
    accounts: this.fb.group({}),
    transfer: this.fb.group({}),
    confirmation: this.fb.group({}),
  });

  get controlQuote() {
    return this.operationForm.get('quote') as FormGroup;
  }

  get controlAccounts() {
    return this.operationForm.get('accounts') as FormGroup;
  }

  get controlTransfer() {
    return this.operationForm.get('transfer') as FormGroup;
  }

  get controlConfirmation() {
    return this.operationForm.get('confirmation') as FormGroup;
  }

  ngOnInit(): void {
    this.store.clearOperationData();
    this.store.startExchangeClock();
  }

  nextStep(): void {
    this.store.nextStep();
  }

  previousStep(): void {
    this.store.prevStep();
  }

  goToStep(step: number): void {
    this.store.setStep(step as any);
  }

  finish() {
    this.success.set(true);
    this.store.stopExchangeClock();
  }

  readonly directBanks = computed(() => {
    const table = this.table();
    if (!table) return [];

    const map = new Map<number, string>();

    table.companyBanks
      .forEach(b => {
        if (!map.has(b.bankId)) {
          map.set(b.bankId, b.bankIcon);
        }
      });

    return Array.from(map.values());
  });

  readonly interbankBanks = computed(() => {
    const table = this.table();
    if (!table) return [];

    const companyBankIds = new Set(
      table.companyBanks.map(cb => cb.bankId)
    );

    return table.banks.filter(
      bank => !companyBankIds.has(bank.id)
    );
  });

  private formatDate(date: Date): string {
    const formatted = FORMATO_FECHA_ES_PE.format(date).replace(',', '');
    return `${formatted} hrs`;
  }

  ngOnDestroy(): void {
    this.store.stopExchangeClock();
    // Resetear completamente cuando el componente se destruye
    this.store.reset();
  }

  reloadPage() {
    window.location.reload();
  }

}
