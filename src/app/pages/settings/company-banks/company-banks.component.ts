import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { CompanyBanks } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CompanyBanksService } from './company-banks.service';
import { CompanyBanksStore } from './company-banks.store';
import { CompanyBanksDialogComponent } from './dialog/company-banks-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
    selector: 'app-company-banks',
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        CompanyBanksDialogComponent
    ],
    templateUrl: './company-banks.component.html'
})
export class CompanyBanksComponent extends TablaCrudLocal<CompanyBanks> implements OnDestroy {
    @ViewChild('companyBankDrawer') companyBankDrawer!: TemplateRef<any>;

    protected service = inject(CompanyBanksService);
    protected store = inject(CompanyBanksStore);
    private dialog = inject(MatDialog);
    private authStore = inject(AuthStore);

    displayedColumns = ['num', 'bankName', 'coin', 'titular', 'accountNumber', 'cci', 'interb', 'type', 'estado', 'action'];

    readonly Permission = Permission;
    selected: CompanyBanks | null = null;

    constructor(public layout: FullComponent, private toastr: ToastrService) {
        super();
        this.updateDataSource();
    }

    openCreate() {
        this.selected = null;
        this.layout.openGlobalDrawer(this.companyBankDrawer);
    }

    openEdit(row: CompanyBanks) {
        this.selected = row;
        this.layout.openGlobalDrawer(this.companyBankDrawer);
    }

    onSaved() {
        this.layout.closeGlobalDrawer();
        this.reload();
    }

    delete(item: CompanyBanks): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Eliminar Cuenta',
                message: `¿Estás seguro que deseas eliminar la cuenta "${item.titular}"?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.service.delete(item).subscribe({
                    next: () => {
                        this.toastr.success('Cuenta eliminada exitosamente');
                        this.store.remove(item.id);
                        this.dataSource.data = this.store.items()!;
                    }
                });
            },
        });
    }

    ngOnDestroy() {
        this.layout.closeGlobalDrawer();
    }

    canCreate(): boolean {
        return this.authStore.hasPermission(Permission.CompanyBanksCreate);
    }

    canEdit(): boolean {
        return this.authStore.hasPermission(Permission.CompanyBanksUpdate);
    }

    canDelete(): boolean {
        return this.authStore.hasPermission(Permission.CompanyBanksDelete);
    }
}
