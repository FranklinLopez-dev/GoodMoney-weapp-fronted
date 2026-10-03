import { Component, inject, signal, computed } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ProfileBanks } from 'src/app/core/models';
import { BanksAccountsStore } from '../banks-accounts.store';
import { BanksAccountsService } from '../bank-accounts.service';
import { OperationCreateStore } from '../../operations/create/store/operation-create.store';
import { MatDialog } from '@angular/material/dialog';
import { AccountModalComponent } from '../personal/personal-account.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { AccountCardComponent } from 'src/app/shared/components/account-card/account.card.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-banks-accounts',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    FallbackImgDirective,
    RouterModule,
    AccountCardComponent
  ],
  templateUrl: './banks-accounts-list.component.html',
  styleUrls: ['./banks-accounts-list.component.scss']
})
export class BanksAccountsComponent {

  private store = inject(BanksAccountsStore);
  private service = inject(BanksAccountsService);
  private storeOperation = inject(OperationCreateStore);
  private dialog = inject(MatDialog);
  private appData = inject(UtilsService);
  private toaster = inject(ToastrService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  accounts = this.store.accounts;
  isLoading = signal(false);

  /** Se llega desde `bankAccountsGuard`; `next` guarda a donde volver para no perder la intencion de cambio. */
  readonly faltaCuentas = signal<string | null>(this.route.snapshot.queryParamMap.get('falta'));
  readonly volverA = signal<string | null>(this.route.snapshot.queryParamMap.get('next'));

  readonly tienePen = computed(() => this.accounts().some(a => a.coinId === 'PEN' && a.status !== false));
  readonly tieneUsd = computed(() => this.accounts().some(a => a.coinId === 'USD' && a.status !== false));
  readonly puedeOperar = computed(() => this.tienePen() && this.tieneUsd());

  /** La cuenta activa de cada moneda, o null si todavía no hay. */
  readonly cuentaPen = computed(() => this.cuentaDe('PEN'));
  readonly cuentaUsd = computed(() => this.cuentaDe('USD'));

  /** Mientras falte una de las dos monedas la pantalla trabaja en modo alta; con las dos, en modo gestión. */
  readonly modoOnboarding = computed(() => !this.tienePen() || !this.tieneUsd());

  private cuentaDe(moneda: 'PEN' | 'USD') {
    const activas = this.accounts().filter(a => a.coinId === moneda && a.status !== false);
    return activas.find(a => a.isCheck) ?? activas[0] ?? null;
  }

  continuarAOperar(): void {
    const destino = this.volverA();
    if (destino) this.router.navigateByUrl(destino);
  }

  coinFilter = signal<'PEN' | 'USD' | null>(null);

  filteredAccounts = computed(() => {
    const filter = this.coinFilter();
    const list = this.accounts();
    return filter ? list.filter(a => a.coinId === filter) : list;
  });

  toggleFilter(coin: 'PEN' | 'USD') {
    this.coinFilter.set(this.coinFilter() === coin ? null : coin);
  }

  /** Pestañas del mockup: TODOS (null) / PEN / USD. */
  setFilter(coin: 'PEN' | 'USD' | null) {
    this.coinFilter.set(coin);
  }

  toggleUse(account: ProfileBanks, event: MatSlideToggleChange) {
    this.accounts().forEach(acc => acc.isCheck = acc.id === account.id);
    this.isLoading.set(true);

    this.service.update(account)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rs: any) => {
          if (rs === 'OK') {
            this.store.updateAccount(account);
            this.storeOperation.updateBankAccounts(account);
            this.toaster.success('Cuenta marcada como principal', 'Éxito');
          } else {
            account.isCheck = false;
          }
        },
        error: () => account.isCheck = false
      });
  }

  addAccount(coin: string) {
    this.dialog.open(AccountModalComponent, {
      width: '720px',
      disableClose: true,
      data: {
        banks: this.store.tables()?.banks,
        companyBanks: this.store.tables()?.companyBanks,
        documentTypes: this.store.tables()?.documentTypes.filter(d => d.isNatural),
        coinId: coin,
        mode: 'create',
        profile: this.appData.profile(),
        isNatural: this.appData.profile()?.documentTypeIsNatural
      }
    }).afterClosed().subscribe(ok => ok && this.reload());
  }

  /** Abre la misma ficha en modo edición, desde la ranura de la moneda. */
  editAccount(account: ProfileBanks) {
    if (!account) return;

    this.dialog.open(AccountModalComponent, {
      width: '720px',
      disableClose: true,
      data: {
        banks: this.store.tables()?.banks,
        companyBanks: this.store.tables()?.companyBanks,
        documentTypes: this.store.tables()?.documentTypes.filter(d => d.isNatural),
        coinId: account.coinId,
        mode: 'edit',
        account,
        profile: this.appData.profile(),
        isNatural: this.appData.profile()?.documentTypeIsNatural
      }
    }).afterClosed().subscribe(ok => ok && this.reload());
  }

  deleteAccount(account: ProfileBanks) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar cuenta bancaria',
        message: `¿Eliminar cuenta de ${account.bankName}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        color: 'warn'
      }
    }).afterClosed().subscribe(confirm => {
      if (!confirm) return;

      this.isLoading.set(true);
      this.service.delete(account)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe(() => {
          this.store.removeAccount(account.id);
          this.storeOperation.removeBankAccounts(account.id);
          this.toaster.success('Cuenta eliminada');
        });
    });
  }

  getDisplayAccountName(account: ProfileBanks): string {
    if (!account) return 'Cuenta';
    const isValid = (v?: string) => !!v && !/^0+$/.test(v);
    if (isValid(account.accountNumber)) {
      return 'Cuenta';
    }
    if (isValid(account.accountNumberCci)) {
      return 'CCI';
    } return '';
  }

  getDisplayAccount(account: ProfileBanks): string {
    if (!account) return '------';
    const isValid = (v?: string) => !!v && !/^0+$/.test(v);
    if (isValid(account.accountNumber)) {
      return account.accountNumber;
    }
    if (isValid(account.accountNumberCci)) {
      return account.accountNumberCci;
    } return '';
  }


  private reload() {
    this.isLoading.set(true);
    this.service.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(list => {
        this.store.setAccounts(list);
        this.storeOperation.setBankAccounts(list);
      });
  }
}
