import {
    Component,
    computed,
    inject,
    Input,
    OnInit,
    OnDestroy,
    TemplateRef,
    ViewChild,
    signal,
    effect
} from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { DestinationSplit, ProfileBanks } from "src/app/core/models";
import { FullComponent } from "src/app/layouts/full/full.component";
import { MaterialModule } from "src/app/material.module";
import { TablerIconsModule } from "angular-tabler-icons";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "src/app/shared/components/confirm-dialog/confirm-dialog.component";
import { AccountModalComponent } from "src/app/pages/bank-accounts/personal/personal-account.component";
import { BanksAccountsService } from "src/app/pages/bank-accounts/bank-accounts.service";
import { finalize } from "rxjs";
import { OperationsService } from "../../../operations.service";
import { FallbackImgDirective } from "src/app/shared/directives/fallback-img.directive";
import { NovodivisasStore } from "../../novodivisas.store";
import { EditAmountDialogComponent } from "../../../create/steps/accounts/edit-amount/edit-amount-dialog.component";
import { Clipboard } from "@angular/cdk/clipboard";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'app-accounts-section',
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
    templateUrl: './accounts-section.component.html',
    styleUrls: ['./accounts-section.component.scss'],
})
export class AccountsSectionComponent implements OnInit, OnDestroy {

    @Input({ required: true }) form!: FormGroup;

    readonly store = inject(NovodivisasStore);
    readonly service = inject(OperationsService);
    readonly layout = inject(FullComponent);
    readonly dialog = inject(MatDialog);
    private banksAccountsService = inject(BanksAccountsService);

    readonly formulario = this.store.form;
    readonly accounts = this.store.bankAccounts;
    readonly table = this.store.table;
    readonly profile = this.store.profile;
    isLoading = signal(false);

    private clipboard = inject(Clipboard);
    private snack = inject(MatSnackBar);

    @ViewChild('originDrawer', { static: true })
    originDrawer!: TemplateRef<any>;

    @ViewChild('destinationDrawer', { static: true })
    destinationDrawer!: TemplateRef<any>;

    tempOriginAccount: ProfileBanks | null = null;
    tempDestinationAccounts: ProfileBanks[] = [];
    editingDestinationIndex: number | null = null;
    private fb = inject(FormBuilder);

    get quote() {
        return this.formulario()?.get('simulation')?.value;
    }

    get controlQuote() {
        return this.formulario()?.get('simulation') as FormGroup;
    }


    constructor() {
        effect(() => {
            const accountsBanks = this.store.bankAccounts();
            if (!accountsBanks?.length) return;

            this.syncOriginAccount();
            this.syncDestinationAccounts();

            this.initDefaultsIfNeeded();
        })
    }

    private accountExists(account: ProfileBanks | null): boolean {
        if (!account) return false;
        return this.accounts().some(a => a.id === account.id);
    }

    private syncOriginAccount(): void {
        const origin = this.form.value.originAccount;

        if (origin && !this.accountExists(origin)) {
            this.form.get('originAccount')!.setValue(null, { emitEvent: false });
        }
    }

    private syncDestinationAccounts(): void {
        const list: DestinationSplit[] = this.form.value.destinationAccounts ?? [];

        const filtered = list.filter(d =>
            this.accountExists(d.account)
        );

        if (filtered.length !== list.length) {
            this.form.get('destinationAccounts')!.setValue(filtered, { emitEvent: false });
        }
    }


    get destinationList(): DestinationSplit[] {
        return this.form.value.destinationAccounts ?? [];
    }

    ngOnInit(): void {
        this.listenReceiveByParts();
        this.controlQuote.get('typeOperation')!.valueChanges.subscribe((value) => {
            this.form.patchValue({
                originAccount: null,
                destinationAccounts: [],
                receiveByParts: false
            }, { emitEvent: false });
            this.store.setBankAccounts(this.accounts());
        });
    }

    ngOnDestroy(): void {
        this.tempOriginAccount = null;
        this.editingDestinationIndex = null;
        this.tempDestinationAccounts = [];
        this.layout.closeGlobalDrawer();
    }

    copy(value: any, key?: string): void {
        if (!value) return;
        this.clipboard.copy(String(value));
        this.snack.open('Copiado al portapapeles', 'OK', {
            duration: 1500,
            panelClass: ['snack-success']
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
        const type = this.quote?.typeOperation;

        return list.filter(a =>
            a.isMe &&
            (type === 'BUY' ? a.coinId === 'USD' : a.coinId === 'PEN')
        );
    });

    readonly destinationAccounts = computed(() => {
        const list = this.accounts() ?? [];
        const type = this.quote?.typeOperation;

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
        const q = this.quote;
        if (!q) return 0;

        return q.typeOperation === 'BUY'
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
            this.quote?.typeOperation === 'BUY' ? 'PEN' : 'USD';

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

    getDisplayAccountNumber(account: ProfileBanks): string {
        if (!account) return '';
        const isValid = (v?: string) => !!v && !/^0+$/.test(v);
        if (isValid(account.accountNumber)) {
            return account.accountNumber;
        }
        if (isValid(account.accountNumberCci)) {
            return account.accountNumberCci;
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

    readonly isSplitInvalid = () => {
        if (!this.form.value.receiveByParts) return false;
        return this.difference() !== 0;
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
        return this.quote?.typeOperation === 'BUY' ? 'S/' : '$';
    }

    requiresSbsInfo(): boolean {
        const table = this.store.table();
        if (!table) return false;

        const usdAmount = this.quote.amountUsd;

        if (usdAmount >= 5000) return true;

        const projectedMonthly =
            table.monthlyAmount + usdAmount;

        return projectedMonthly >= table.company.monthlyChange;
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
                profile: this.profile(),
                admi: true,
                isNatural: this.profile()?.documentTypeIsNatural
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            this.realoadProfileBanks();
        });
    }

    private getOriginCoin(): 'PEN' | 'USD' {
        return this.quote?.typeOperation === 'BUY'
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
                profile: this.profile(),
                admi: true,
                isNatural: this.profile()?.documentTypeIsNatural
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            this.realoadProfileBanks();
        });
    }

    private getDestinationCoin(): 'PEN' | 'USD' {
        return this.quote?.typeOperation === 'BUY'
            ? 'PEN'
            : 'USD';
    }

    private realoadProfileBanks(): void {
        this.isLoading.set(true);
        this.banksAccountsService.getAllId(this.profile()?.id!)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(accounts => {
                this.store.setBankAccounts(accounts);
            });
    }


}