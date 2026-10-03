import { Component, inject, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { DocumentType } from 'src/app/core/models';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeStore } from './document-type.store';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { DocumentTypeDialogComponent } from './dialog/document-type-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
    standalone: true,
    selector: 'app-document-types',
    imports: [CommonModule, MaterialModule, DocumentTypeDialogComponent, TablerIconsModule],
    templateUrl: './document-type.component.html'
})
export class DocumentTypesComponent extends TablaCrudLocal<DocumentType> implements OnDestroy {
    @ViewChild('documentDrawer') documentDrawer!: TemplateRef<any>;

    protected service = inject(DocumentTypeService);
    public authStore = inject(AuthStore);
    public store = inject(DocumentTypeStore);
    private dialog = inject(MatDialog);

    displayedColumns: string[] = ['num', 'codigo', 'documento', 'min', 'max', 'exacto', 'number', 'pn', 'default', 'estado', 'action'];

    selected: DocumentType | null = null;
    readonly Permission = Permission;

    constructor(public layout: FullComponent, private toastr: ToastrService) {
        super();
        this.updateDataSource();
    }

    openCreate() {
        this.selected = null;
        this.layout.openGlobalDrawer(this.documentDrawer);
    }

    openEdit(row: DocumentType) {
        this.selected = row;
        this.layout.openGlobalDrawer(this.documentDrawer);
    }

    onSaved() {
        this.layout.closeGlobalDrawer();
        this.reload();
    }

    delete(row: DocumentType) {
        const dialog = this.dialog.open(ConfirmDialogComponent, {
            width: '420px',
            data: {
                title: 'Eliminar documento',
                message: `¿Deseas eliminar el documento "${row.name}"?`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                color: 'warn'
            }
        });

        dialog.afterClosed().subscribe(ok => {
            if (!ok) return;

            this.service.delete(row).subscribe(() => {
                this.toastr.success('Documento eliminado correctamente', 'Éxito');
                this.store.remove(row.id);
                this.dataSource.data = this.store.items()!;
            });
        });
    }

    ngOnDestroy() {
        this.layout.closeGlobalDrawer();
    }

    canCreate(): boolean {
        return this.authStore.hasPermission(Permission.DocumentTypeCreate);
    }

    canEdit(): boolean {
        return this.authStore.hasPermission(Permission.DocumentTypeUpdate);
    }

    canDelete(): boolean {
        return this.authStore.hasPermission(Permission.DocumentTypeDelete);
    }

}
