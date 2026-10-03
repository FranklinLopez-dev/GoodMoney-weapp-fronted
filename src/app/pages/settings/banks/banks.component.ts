import { Component, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { MaterialModule } from 'src/app/material.module';
import { Banks } from 'src/app/core/models';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { BanksDialogComponent } from './dialog/banks-dialog.component';
import { BanksService } from './banks.service';
import { BanksStore } from './banks.store';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
    standalone: true,
    selector: 'app-banks',
    imports: [CommonModule, MaterialModule, BanksDialogComponent, TablerIconsModule, FallbackImgDirective],
    templateUrl: './banks.component.html'
})
export class BanksComponent extends TablaCrudLocal<Banks> implements OnDestroy {
    @ViewChild('bankDrawer') bankDrawer!: TemplateRef<any>;

    protected service = inject(BanksService);
    public authStore = inject(AuthStore);
    public store = inject(BanksStore);
    private dialog = inject(MatDialog);

    displayedColumns: string[] = ['num', 'codigo', 'banco', 'minAcount', 'maxAcount', 'minAcountInter', 'maxAcountInter', 'comitionPen', 'comitionUsd', 'estado', 'action'];

    selected: Banks | null = null;
    readonly Permission = Permission;

    constructor(public layout: FullComponent, private toastr: ToastrService) {
        super();
        this.updateDataSource();
    }

    openCreate() {
        this.selected = null;
        this.layout.openGlobalDrawer(this.bankDrawer);
    }

    openEdit(row: Banks) {
        this.selected = row;
        this.layout.openGlobalDrawer(this.bankDrawer);
    }

    onSaved() {
        this.layout.closeGlobalDrawer();
        this.reload();
    }

    delete(row: Banks) {
        const dialog = this.dialog.open(ConfirmDialogComponent, {
            width: '420px',
            data: {
                title: 'Eliminar banco',
                message: `¿Deseas eliminar el banco "${row.name}"?`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                color: 'warn'
            }
        });

        dialog.afterClosed().subscribe(ok => {
            if (!ok) return;

            this.service.delete(row).subscribe(() => {
                this.toastr.success('Banco eliminado correctamente', 'Éxito');
                this.store.remove(row.id);
                this.dataSource.data = this.store.items()!;
            });
        });
    }

    ngOnDestroy() {
        this.layout.closeGlobalDrawer();
    }

    canCreate(): boolean {
        return this.authStore.hasPermission(Permission.BankCreate);
    }

    canEdit(): boolean {
        return this.authStore.hasPermission(Permission.BankUpdate);
    }

    canDelete(): boolean {
        return this.authStore.hasPermission(Permission.BankDelete);
    }

}
