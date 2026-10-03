import { Component, inject, signal, computed, Input } from '@angular/core';
import { ProfileBanks } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { ProfilesUserStore } from 'src/app/pages/security/users/profiles/profiles.store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NovodivisasStore } from 'src/app/pages/operations/novodivisas/novodivisas.store';
import { AssignProfilesStore } from 'src/app/pages/security/assign-profiles/assign-profiles.store';
type ProfileContext = 'admin' | 'novodivisas' | 'assign-profiles';

@Component({
  selector: 'app-banks-accounts-profile',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    FallbackImgDirective
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class BanksAccountsProfileComponent {

  @Input({ required: true }) context!: ProfileContext;

  private store = inject(ProfilesUserStore);
  private novodivisas = inject(NovodivisasStore);
  private assignProfilesStore = inject(AssignProfilesStore);
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private service = inject(BanksAccountsService);
  private toaster = inject(ToastrService);

  copiedKey: string | null = null;
  accounts = computed(() => {
    return this.context === 'admin'
      ? this.store.bankAccounts()
      : this.context === 'novodivisas' ? this.novodivisas.bankAccounts()
        : this.assignProfilesStore.bankAccounts();
  });
  isLoading = signal(false);

  coinFilter = signal<'PEN' | 'USD' | null>(null);

  filteredAccounts = computed(() => {
    const filter = this.coinFilter();
    const list = this.accounts();
    return filter ? list.filter(a => a.coinId === filter) : list;
  });

  toggleFilter(coin: 'PEN' | 'USD') {
    this.coinFilter.set(this.coinFilter() === coin ? null : coin);
  }

  getDisplayAccountName(account: ProfileBanks): string {
    if (!account) return '';
    const isValid = (v?: string) => !!v && !/^0+$/.test(v);
    if (isValid(account.accountNumber)) {
      return '';
    }
    if (isValid(account.accountNumberCci)) {
      return 'CCI';
    } return '';
  }

  getDisplayAccount(account: ProfileBanks): string {
    if (!account) return '-------';
    const isValid = (v?: string) => !!v && !/^0+$/.test(v);
    if (isValid(account.accountNumber)) {
      return account.accountNumber;
    }
    if (isValid(account.accountNumberCci)) {
      return account.accountNumberCci;
    } return '';
  }

  copy(value: any, key?: string): void {
    if (!value) return;

    this.clipboard.copy(String(value));
    this.copiedKey = key ?? null;

    this.snack.open('Copiado al portapapeles', 'OK', {
      duration: 1500,
      panelClass: ['snack-success']
    });

    setTimeout(() => (this.copiedKey = null), 1200);
  }

  delete(account: ProfileBanks) {
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
      this.service.deleteAdmin(account)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe(() => {
          if ( this.context === 'admin') {
            this.store.removeAccount(account.id);
          } else {
            this.novodivisas.removeAccount(account.id);
          }
          this.toaster.success('Cuenta eliminada');
        });
    });
  }

}
