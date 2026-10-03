import { VoucherViewerService } from 'src/app/pages/operations/voucher-viewer.service';
import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { TablerIconsModule } from 'angular-tabler-icons';
import { OperationBanks } from 'src/app/core/models/operations/operations.model';
import { MaterialModule } from 'src/app/material.module';

@Component({
    selector: 'operation-transfer',
    imports: [
        MaterialModule,
        MatCardModule,
        TablerIconsModule,
        MatInputModule,
        MatButtonModule,
        CommonModule
    ],
    templateUrl: './transfer.component.html'
})
export class TransferOperationComponent {
    readonly vouchers = inject(VoucherViewerService);

    constructor(
        public dialogRef: MatDialogRef<TransferOperationComponent>,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public operationBanks: OperationBanks[]
    ) { }

    goBack(): void {
        this.dialogRef.close();
    }
}
