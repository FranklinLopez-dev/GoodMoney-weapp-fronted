import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Activities } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ActivitiesService } from './activities.service';
import { ActivitiesStore } from './activities.store';
import { ActivitiesDialogComponent } from './activities-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { TablaCrudLocal } from 'src/app/shared/base/tabla-crud-local.base';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './activities.component.html'
})
export class ActivitiesComponent extends TablaCrudLocal<Activities> {

  protected service = inject(ActivitiesService);
  protected store = inject(ActivitiesStore);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private authStore = inject(AuthStore);

  displayedColumns = ['num', 'code', 'description', 'status', 'action'];

  readonly Permission = Permission;

  constructor() {
    super();
    this.updateDataSource();
  }

  create(): void {
    const dialogRef = this.dialog.open(ActivitiesDialogComponent, {
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

  edit(item: Activities): void {
    const dialogRef = this.dialog.open(ActivitiesDialogComponent, {
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

  delete(item: Activities): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Actividad',
        message: `¿Estás seguro que deseas eliminar la actividad "${item.description}"?`,
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (confirmed) => {
        if (!confirmed) return;

        this.service.delete(item).subscribe({
          next: () => {
            this.toastr.success('Actividad eliminada exitosamente');
            this.store.remove(item.id);
            this.dataSource.data = this.store.items()!;
          }
        });
      },
    });
  }

  canCreate(): boolean {
    return this.authStore.hasPermission(Permission.ActivitiesCreate);
  }

  canEdit(): boolean {
    return this.authStore.hasPermission(Permission.ActivitiesUpdate);
  }

  canDelete(): boolean {
    return this.authStore.hasPermission(Permission.ActivitiesDelete);
  }
}
