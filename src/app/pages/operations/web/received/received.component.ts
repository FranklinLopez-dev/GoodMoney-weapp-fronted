import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, inject, Inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { OperationsService } from '../../operations.service';
import { Operation, OperationBanks } from 'src/app/core/models/operations/operations.model';
import { OperationsWebStore } from '../operations-web.store';
import { CompanyBanks, Profile } from 'src/app/core/models';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { MatDialog } from '@angular/material/dialog';
import { ProfileReadonlyComponent } from 'src/app/pages/profiles/pages/details/components/profile-readonly/profile-readonly.component';

@Component({
    selector: 'operation-create-received',
    imports: [
        MaterialModule,
        TablerIconsModule,
        MatDividerModule,
        ClipboardModule,
        ReactiveFormsModule
    ],
    templateUrl: './received.component.html'
})
export class ReceivedComponent {

    protected store = inject(OperationsWebStore);
    private profileService = inject(ProfilesService);
    private dialog = inject(MatDialog);
    companyBanks: CompanyBanks[] = [];

    operationForm = this._formBuilder.group({
        operationBanks: this._formBuilder.array([])
    });

    get operationBanks(): FormArray {
        return this.operationForm.get('operationBanks') as FormArray;
    }

    constructor(
        private _formBuilder: FormBuilder,
        private service: OperationsService,
        private toastr: ToastrService,
        public dialogRef: MatDialogRef<ReceivedComponent>,
        @Inject(MAT_DIALOG_DATA) public operation: Operation
    ) { }

    ngOnInit(): void {
        const coinCode = this.operation.typeOperation == '1' ? 'PEN' : 'USD';
        this.companyBanks = this.store.companyBanks().filter(c => c.coinCode == coinCode);

        if (this.operation?.operationBanks?.length) {
            this.operation.operationBanks.forEach(bank => this.addOperationBank(bank));
        }

    }

    addOperationBank(bank: OperationBanks): void {
        const group = this._formBuilder.group({
            id: [bank.id],
            companyBankId: [null, Validators.required],
            codeOperation: [null, Validators.required],
            amount: [bank.amount || 0],
            profileBankClient2: [bank.profileBankClient2 || null],
            operationImage: [null],
            operationImageName: [null],
            operationImageByte: [null]
        });

        this.operationBanks.push(group);
    }

    goBack(): void {
        this.dialogRef.close();
    }

    onSelectImage(event: any, index: number): void {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const image = e.target.result;
                const base64 = e.target.result.split(',')[1];
                this.operationBanks.at(index).get('operationImageByte')?.setValue(base64);
                this.operationBanks.at(index).get('operationImageName')?.setValue(file.name);
                this.operationBanks.at(index).get('operationImage')?.setValue(image);
            };

            reader.readAsDataURL(file);
        }
    }

    onRemoveImage(index: number): void {
        const bankGroup = this.operationBanks.at(index);

        bankGroup.get('operationImage')?.setValue(null);
        bankGroup.get('operationImageName')?.setValue(null);
        bankGroup.get('operationImageByte')?.setValue(null);

        bankGroup.markAsDirty();
    }

    verPerfil(): void {
        this.profileService.getById(this.operation.eProfile.id)
            .subscribe({
                next: (response: Profile) => {
                    this.dialog
                        .open(ProfileReadonlyComponent, {
                            data: response,
                            disableClose: true,
                            maxWidth: '800px',
                            width: '90vw',
                        })
                        .afterClosed()
                },
            });
    }

    confirmar(): void {

        this.operationForm.markAllAsTouched();

        if (this.operationForm.invalid) {
            this.toastr.warning('Completa los campos obligatorios para confirmar.', 'Advertencia');
            return;
        }

        this.operation.loadingConfirmar = true;
        this.operation.operationBanks = this.operationBanks.value;

        this.service
            .confirmarTransferenciaEnviada(this.operation)
            .pipe(
                finalize(() => {
                    this.operation.loadingConfirmar = false;
                }),
            )
            .subscribe({
                next: (rs: any) => {
                    if (rs) {
                        this.dialogRef.close(true);
                        this.toastr.success("¡Correo Enviado Correctamente!", "Éxito");
                    } else {
                        this.toastr.warning(rs, "Advertencia");
                    }
                },
            });
    }

    public copiar(data: OperationBanks) {
        data.isCopiar = true;
        setTimeout(() => {
            data.isCopiar = false;
        }, 2000);
    }

    public booleanNumber(event: string): boolean {
        if (Number(event) == 0) return false;
        return true;
    }

}
