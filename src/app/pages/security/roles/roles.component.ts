import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Roles } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RolesService } from './roles.service';
import { RolesStore } from './roles.store';
import { RolesDialogComponent } from './roles-dialog.component';
import { PermissionsModalComponent } from './permissions/permissions-modal.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    MaterialModule,
    TablerIconsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './roles.component.html'
})
export class RolesComponent extends TablaCrudLocal<Roles> {

  protected service = inject(RolesService);
  protected store = inject(RolesStore);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private authStore = inject(AuthStore);

  displayedColumns = ['num', 'name', 'isDefault', 'action'];

  readonly Permission = Permission;

  constructor() {
    super();
    this.updateDataSource();
  }

  create(): void {
    const dialogRef = this.dialog.open(RolesDialogComponent, {
      disableClose: true,
      width: '500px',
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;
        this.reload();
      },
    });
  }

  edit(item: Roles): void {
    const dialogRef = this.dialog.open(RolesDialogComponent, {
      disableClose: true,
      width: '500px',
      data: item,
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;
        this.reload();
      },
    });
  }

  editPermissions(item: Roles): void {
    this.dialog.open(PermissionsModalComponent, {
      disableClose: true,
      data: { role: item },
    });
  }

  delete(item: Roles): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Rol',
        message: `¿Estás seguro que deseas eliminar el rol "${item.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (confirmed) => {
        if (!confirmed) return;

        this.service.delete(item).subscribe({
          next: () => {
            this.toastr.success('Rol eliminado exitosamente');
            this.store.remove(item.id);
            this.updateDataSource();
          }
        });
      },
    });
  }

  canCreate() { return this.authStore.hasPermission(Permission.RolesCreate); }
  canUpdate() { return this.authStore.hasPermission(Permission.RolesUpdate); }
  canDelete() { return this.authStore.hasPermission(Permission.RolesDelete); }
}
