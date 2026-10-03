import { Component, Inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { DynamicValidatorsService, IDynamicValidatable } from 'src/app/shared/services/dynamic-validators.service';
import { Banks, CompanyBanks, DocumentType, Profile, ProfileBanks } from 'src/app/core/models';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { mapBankCciToValidatable, mapBankToValidatable, mapDocumentToValidatable } from 'src/app/utils/document.util';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { debounceTime, filter, finalize, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from 'src/app/core/auth/auth.service';
import { BanksAccountsService } from '../bank-accounts.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-personal-account',
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule, SelectSearchAsyncComponent, InputMaskDirective],
    templateUrl: './personal-account.component.html'
})
export class AccountModalComponent implements OnInit {

    banks = signal<Banks[]>(this.data.banks);
    companyBanks = signal<CompanyBanks[]>(this.data.companyBanks);
    documentTypes = signal<DocumentType[]>(this.data.documentTypes);
    coinId = signal<'PEN' | 'USD'>(this.data.coinId);
    mode = signal<'create' | 'edit'>(this.data.mode);
    isSaving = signal(false);

    filteredBanks: Banks[] = [];
    bank = signal<Banks | null>(null);
    documentType = signal<DocumentType | null>(null);

    typeAccounts = [
        { id: '1', name: 'AHORRO' },
        { id: '2', name: 'CORRIENTE' }
    ];

    title = computed(() =>
        this.mode() === 'create'
            ? `Agregar cuenta ${this.coinId() == 'PEN' ? 'soles' : 'dólares'}`
            : `Editar cuenta ${this.coinId() == 'PEN' ? 'soles' : 'dólares'}`
    );

    form: FormGroup = this.fb.group({
        bankId: [null, Validators.required],
        coinId: [this.coinId(), Validators.required],
        typeAccount: [null, Validators.required],
        accountNumber: [null, Validators.required],
        accountNumberCci: [null, Validators.required],
        isMe: [false, Validators.requiredTrue],
        isMancomunada: [false],
        documentTypeManId: [null],
        documentNumberMan: [null],
        nameMan: [null],
        lastNameMan: [null]
    });

    get control() {
        return this.form.controls;
    }

    get bankControl() {
        return this.form.get('bankId') as FormControl;
    }

    hasCompanyAccount = () => {
        const bank = this.bank();
        if (!bank) return false;

        return this.companyBanks().some(
            c => c.bankId === bank.id && c.coinCode === this.coinId()
        );
    };

    constructor(
        private fb: FormBuilder,
        public validators: DynamicValidatorsService,
        private destroyRef: DestroyRef,
        private authService: AuthService,
        private service: BanksAccountsService,
        private toaster: ToastrService,
        private dialogRef: MatDialogRef<AccountModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            banks: Banks[];
            companyBanks: CompanyBanks[];
            documentTypes: DocumentType[];
            coinId: 'PEN' | 'USD';
            mode: 'create' | 'edit';
            account: ProfileBanks,
            profile: Profile,
            admi: boolean,
            isNatural: boolean
        }
    ) {

    }

    ngOnInit() {
        this.filteredBanks = this.banks();

        if (this.mode() === 'create') {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            this.control['documentTypeManId'].setValue(defaultType?.id ?? null);
        } else {
            this.bank.set(this.banks().find(b => b.id === this.data.account.bankId) || null);
            this.setBank();
            if (this.data.account.isMancomunada) {
                this.documentType.set(this.documentTypes().find(d => d.id === this.data.account.documentTypeManId) || null);
                this.applyValidators(this.data.account.isMancomunada);
            }
            this.form.patchValue(this.data.account);
        }

        this.control['documentNumberMan'].valueChanges
            .pipe(
                debounceTime(400),
                filter(() => this.documentType()?.code === '1'),
                filter(() => this.control['documentNumberMan'].valid),
                switchMap(value => this.authService.getDni(value)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(response => {
                if (response?.success) {
                    const lastName = response.data.apellido_paterno + ' ' + response.data.apellido_materno;
                    this.control['nameMan'].setValue(response.data.nombres);
                    this.control['lastNameMan'].setValue(lastName);
                }
            });

        this.control['isMancomunada'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(isMancomunada => this.applyValidators(isMancomunada));
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

        if (this.hasCompanyAccount()) {
            cci.setValue("".padStart(this.bank()?.minAcountInter!, "0"));
        } else {
            acc.setValue("".padStart(this.bank()?.minAcount!, "0"));
        }
    }

    setDocumentType(id: number) {
        const type = this.documentTypes().find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.form.get('documentNumberMan') as FormControl;
        this.validators.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
    }

    applyValidators = (isMancomunada: boolean) => {
        const validatable: IDynamicValidatable = {
            isRequired: isMancomunada
        };

        const documentTypeCtrl = this.control['documentTypeManId'] as FormControl;
        const documentNumberCtrl = this.control['documentNumberMan'] as FormControl;
        const nameCtrl = this.control['nameMan'] as FormControl;
        const lastNameCtrl = this.control['lastNameMan'] as FormControl;

        if (this.documentType()) {
            this.validators.applyValidators(documentNumberCtrl, isMancomunada ? mapDocumentToValidatable(this.documentType()) : null);
        } else {
            this.validators.applyValidators(documentNumberCtrl, isMancomunada ? validatable : null);
        }

        this.validators.applyValidators(documentTypeCtrl, isMancomunada ? validatable : null);
        this.validators.applyValidators(nameCtrl, isMancomunada ? validatable : null);
        this.validators.applyValidators(lastNameCtrl, isMancomunada ? validatable : null);

        if (!isMancomunada) {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            documentTypeCtrl.setValue(defaultType?.id ?? null);
            documentNumberCtrl.reset();
            nameCtrl.reset();
            lastNameCtrl.reset();
        }
    };

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const v = this.form.value;

        const payload: any = {
            typeAccount: v.typeAccount,
            coinId: this.coinId(),
            bankId: v.bankId,
            accountNumber: v.accountNumber,
            accountNumberCci: v.accountNumberCci,
            isMancomunada: v.isMancomunada,
            documentTypeManId: v.isMancomunada ? v.documentTypeManId : null,
            documentNumberMan: v.isMancomunada ? v.documentNumberMan : null,
            nameMan: v.isMancomunada ? v.nameMan?.trim() : null,
            lastNameMan: v.isMancomunada ? v.lastNameMan?.trim() : null,
            isMe: v.isMe,
            isTercero: false,
            status: true,
            bankIcon: this.bank()?.icon,
            bankName: this.bank()?.name,
            documentTypeId: this.data.profile?.documentTypeId ?? null,
            documentNumber: this.data.profile?.documentNumber ?? null,
            name: this.data.profile?.names ?? null,
            lastName: this.data.profile?.lastNames ?? null,
        };

        this.isSaving.set(true);
        this.form.disable();

        if (!this.data.profile) {
            this.dialogRef.close(payload);
            return;
        }

        if (!this.data.admi) {
            this.service.save(payload)
                .pipe(
                    finalize(() => {
                        this.isSaving.set(false);
                        this.form.enable();
                    })
                )
                .subscribe({
                    next: (response) => {
                        if (response == 'OK') {
                            this.toaster.success(
                                "Cuenta registrada correctamente",
                                "Éxito"
                            );

                            this.dialogRef.close(true);
                        } else {
                            this.toaster.warning(
                                response,
                                "Advertencia"
                            );
                        }

                    }
                });
        } else {
            payload.eProfileId = this.data.profile.id
            this.service.saveAdmi(payload)
                .pipe(
                    finalize(() => {
                        this.isSaving.set(false);
                        this.form.enable();
                    })
                )
                .subscribe({
                    next: (response) => {
                        if (response == 'OK') {
                            this.toaster.success(
                                "Cuenta registrada correctamente",
                                "Éxito"
                            );

                            this.dialogRef.close(true);
                        } else {
                            this.toaster.warning(
                                response,
                                "Advertencia"
                            );
                        }

                    }
                });
        }


    }

    close() {
        this.dialogRef.close();
    }
}
