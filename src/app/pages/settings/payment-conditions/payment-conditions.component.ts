import { Component, inject, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PaymentConditions } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PaymentConditionsService } from './payment-conditions.service';
import { PaymentConditionsStore } from './payment-conditions.store';
import { PaymentConditionsDialogComponent } from './payment-conditions-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
    selector: 'app-payment-conditions',
    standalone: true,
    imports: [
        MaterialModule,
        TablerIconsModule
    ],
    templateUrl: './payment-conditions.component.html'
})
export class PaymentConditionsComponent extends TablaCrudLocal<PaymentConditions> implements OnInit {

    protected service = inject(PaymentConditionsService);
    protected store = inject(PaymentConditionsStore);
    private authStore = inject(AuthStore);
    public dialog = inject(MatDialog);

    displayedColumns = ['num', 'code', 'description', 'refSunat', 'isDefault', 'status', 'action'];

    readonly Permission = Permission;

    constructor(private toastr: ToastrService) {
        super();
    }

    ngOnInit() {
        this.updateDataSource();
    }

    openCreate(): void {
        const dialog = this.dialog.open(PaymentConditionsDialogComponent, {
            disableClose: true
        });

        dialog.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;
                this.reload();
            }
        });
    }

    openEdit(item: PaymentConditions): void {
        const dialog = this.dialog.open(PaymentConditionsDialogComponent, {
            disableClose: true,
            data: item
        });

        dialog.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;
                this.reload();
            }
        });
    }

    delete(item: PaymentConditions): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Eliminar Método de Pago',
                message: `¿Estás seguro que deseas eliminar este método de pago "${item.description}"?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.service.delete(item).subscribe({
                    next: () => {
                        this.toastr.success('Método de pago eliminado correctamente', 'Éxito');
                        this.store.remove(item.id);
                        this.dataSource.data = this.store.items()!;
                    }
                });
            },
        });
    }

    canCreate(): boolean {
        return this.authStore.hasPermission(Permission.PaymentConditionCreate);
    }

    canUpdate(): boolean {
        return this.authStore.hasPermission(Permission.PaymentConditionUpdate);
    }

    canDelete(): boolean {
        return this.authStore.hasPermission(Permission.PaymentConditionDelete);
    }
}
