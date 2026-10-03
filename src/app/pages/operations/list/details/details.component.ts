import { Component, inject, Inject } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { finalize, Subject } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MaterialModule } from 'src/app/material.module';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompanyBanks } from 'src/app/core/models';
import { OperationsService } from '../../operations.service';
import { Operation } from 'src/app/core/models/operations/operations.model';
import { OperationsStore } from '../operations-list.store';
import { OperationsRealtimeService } from '../../operations-realtime.service';

@Component({
    selector: 'operations-web-detail',
    templateUrl: './details.component.html',
    imports: [
        MaterialModule,
        TablerIconsModule,
        MatDividerModule,
        ClipboardModule,
        ReactiveFormsModule
    ],
})
export class OperationDetailComponent {

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private realtime = inject(OperationsRealtimeService);   
    companyBank: CompanyBanks = {} as CompanyBanks;
    operationImage: any = null;
    copiado = false;

    protected store = inject(OperationsStore);
    companyBanks = this.store.companyBanks();

    operationForm = this._formBuilder.group({
        codeOperation: [null, [Validators.required, Validators.maxLength(20)],],
        operationImage: [null],
    });

    constructor(
        private _formBuilder: FormBuilder,
        private _operationsService: OperationsService,
        private toastr: ToastrService,
        public dialogRef: MatDialogRef<OperationDetailComponent>,
        @Inject(MAT_DIALOG_DATA) public operation: Operation
    ) { }

    ngOnInit(): void {

        let filtro = this.companyBanks
            .filter((x) => x.bankId == this.operation.profileBankClient1.bankId)
            .filter((x) => x.coinCode == this.operation.profileBankClient1.coinId);

        if (filtro.length > 0) {
            this.companyBank = filtro[0];
        } else {
            filtro = this.companyBanks
                .filter((x) => x.flagInter)
                .filter((x) => x.coinCode == this.operation.profileBankClient1.coinId);
            if (filtro.length > 0) {
                this.companyBank = filtro[0];
            }
        }

    }

    confirmarTransferencia(): void {

        this.operationForm.markAllAsTouched();

        if (this.operationForm.invalid) return;

        this.operation.loadingConfirmar = true;
        this.operation.companyBankId = this.companyBank.id;
        this.operation.codeOperation = String(this.operationForm.value.codeOperation);
        this.operation.operationImageByte = this.operationForm.value.operationImage ?? null;

        if (!this.operation.companyBankId) {
            this.toastr.warning(
                "No se puede confirmar esta operación, porque no hay una cuenta bancaria que se pueda asociar a esta operación",
                "Advertencia"
            );
        }

        this._operationsService.update(this.operation)
            .pipe(
                finalize(() => {
                    this.operation.loadingConfirmar = false;
                }),
            )
            .subscribe({
                next: (rs: any) => {
                    if (rs == "OK") {
                        this.realtime.addNewOperation();
                        this.toastr.success(
                            "¡Transferencia confirmada correctamente!",
                            "Éxito"
                        );
                        this.dialogRef.close(this.operation.id);
                    } else {
                        this.toastr.warning(rs, "Advertencia");
                    }
                }
            });
    }

    onSelectImage(event: any): void {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.operationImage = e.target.result;
                this.operationForm.get('operationImage')?.setValue(this.operationImage?.replace(/^data:image\/[a-z]+;base64,/, ""));
            };

            reader.readAsDataURL(file);
        }
    }

    onRemoveImage() {
        this.operationImage = null;
        this.operationForm.get('step3.operationImage')?.reset();
    }

    public copiar() {
        this.copiado = true;
        setTimeout(() => {
            this.copiado = false;
        }, 2000);
    }

    public booleanNumber(event: string): boolean {
        if (Number(event) == 0) return false;
        return true;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
