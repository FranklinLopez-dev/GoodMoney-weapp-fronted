import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Positions } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PositionsStore } from './positions.store';
import { PositionsDialogComponent } from './positions-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { PositionsService } from './positions.service';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './positions.component.html'
})
export class PositionsComponent extends TablaCrudLocal<Positions> {

  protected service = inject(PositionsService);
  protected store = inject(PositionsStore);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private authStore = inject(AuthStore);

  displayedColumns = ['num', 'code', 'sbs', 'description', 'status', 'action'];

  readonly Permission = Permission;

  constructor() {
    super();
    this.updateDataSource();
  }

  create(): void {
    const dialogRef = this.dialog.open(PositionsDialogComponent, {
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

  edit(item: Positions): void {
    const dialogRef = this.dialog.open(PositionsDialogComponent, {
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

  delete(item: Positions): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Posición',
        message: `¿Estás seguro que deseas eliminar la posición "${item.description}"?`,
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (confirmed) => {
        if (!confirmed) return;

        this.service.delete(item).subscribe({
          next: () => {
            this.toastr.success('Posición eliminada exitosamente');
            this.store.remove(item.id);
            this.dataSource.data = this.store.items()!;
          }
        });
      },
    });
  }

  canCreate(): boolean {
    return this.authStore.hasPermission(Permission.PositionsCreate);
  }

  canEdit(): boolean {
    return this.authStore.hasPermission(Permission.PositionsUpdate);
  }

  canDelete(): boolean {
    return this.authStore.hasPermission(Permission.PositionsDelete);
  }
}
