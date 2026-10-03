import { esEstadoActivo, aEstadoApi } from 'src/app/shared/utils/estado';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Banks, CompanyBanks } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { CompanyBanksService } from '../company-banks.service';
import { BanksStore } from '../../banks/banks.store';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapBankCciToValidatable, mapBankToValidatable } from 'src/app/utils/document.util';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';

@Component({
    standalone: true,
    selector: 'app-company-banks-dialog',
    imports: [MaterialModule, ReactiveFormsModule, SelectSearchAsyncComponent, FallbackImgDirective, InputMaskDirective],
    templateUrl: './company-banks-dialog.component.html'
})
export class CompanyBanksDialogComponent {

    @Input() data: CompanyBanks | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private service = inject(CompanyBanksService);
    private toastr = inject(ToastrService);
    private bankStore = inject(BanksStore);

    loading = signal(false);
    banks = computed(() =>
        (this.bankStore.items() ?? []).map(bank => ({
            ...bank,
            icon: `data:image/jpeg;base64,${bank.icon}`
        }))
    );

    filteredBanks: Banks[] = [];
    bank = signal<Banks | null>(null);
    coin = signal<any | null>(null);

    typeAccounts = [
        { id: '1', name: 'AHORRO' },
        { id: '2', name: 'CORRIENTE' }
    ];

    coins = [
        { id: 'PEN', icon: './assets/images/flag/peru.png', name: 'SOLES' },
        { id: 'USD', icon: './assets/images/flag/eeuu.jpg', name: 'DÓLARES' }
    ];

    form = this.fb.nonNullable.group({
        id: [null],
        bankId: [null, Validators.required],
        accountNumber: [null],
        accountNumberCci: [null],
        flagInter: [false],
        status: [true],
        titular: [null, Validators.required],
        coinCode: [null, Validators.required],
        type: [null, Validators.required]
    });

    get control() {
        return this.form.controls;
    }

    get bankControl() {
        return this.form.get('bankId') as FormControl;
    }

    constructor(public validators: DynamicValidatorsService) {
        this.filteredBanks = this.banks();
    }

    ngOnInit() {
        if (this.data) {
            this.bank.set(this.banks().find(b => b.id === this.data?.bankId) || null);
            this.coin.set(this.coins.find(b => b.id === this.data?.coinCode) || null);
            this.setBank();
            this.form.patchValue(this.data as any);
            this.form.get('status')?.setValue(esEstadoActivo(this.data.status));
        }
    }

    loadBanks = (search: string) => {
        this.filteredBanks = this.banks().filter(b =>
            b.name.toLowerCase().includes(search.toLowerCase())
        );
    };

    setBank(bank?: Banks) {
        if (bank) this.bank.set(bank);
        const acc = this.form.get('accountNumber') as FormControl;
        const cci = this.form.get('accountNumberCci') as FormControl;
        this.validators.applyValidatorsWithReset(acc, mapBankToValidatable(this.bank()));
        this.validators.applyValidatorsWithReset(cci, mapBankCciToValidatable(this.bank()));
    }

    setCoin(code: string) {
        this.coin.set(this.coins.find(b => b.id === code) || null);
    }

    save(): void {
        if (this.loading()) return;

        const payload: any = this.form.getRawValue();
        payload.status = aEstadoApi(payload.status);
        payload.saldo = 0;
        payload.amountMin = 0;
        payload.isFacturar = true;

        this.loading.set(true);
        const req = payload.id
            ? this.service.update(payload as any)
            : this.service.create(payload as any);

        req.pipe(finalize(() => this.loading.set(false))).subscribe({
            next: () => {
                if (payload.id) {
                    this.toastr.success('Cuenta editada correctamente', 'Éxito');
                } else {
                    this.toastr.success('Cuenta creada correctamente', 'Éxito');
                }
                this.saved.emit();
            }
        });
    }
}
