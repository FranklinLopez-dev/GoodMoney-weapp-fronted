import { Component, inject, computed, ViewChild } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { Serie } from 'src/app/core/models';
import { SeriesService } from '../../../../series.service';
import { finalize } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { SeriesFormDialogComponent } from './dialog/series-form-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { SeriesStore } from './series.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Component({
  standalone: true,
  selector: 'company-series-tab',
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: './company-series.component.html'
})
export class CompanySeriesComponent {

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  private seriesService = inject(SeriesService);
  public store = inject(SeriesStore);
  private paginator: MatPaginator;

  loading = this.store.loading;
  series = computed(() => this.store.series());

  dataSource = new MatTableDataSource<Serie>([]);
  displayedColumns: string[] = [
    'id',
    'title',
    'serie',
    'correlative',
    'automated',
    'action',
  ];
  pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;

  constructor(private toastr: ToastrService, public dialog: MatDialog) {
    this.updateDataSource();
  }

  private updateDataSource(): void {
    this.dataSource.data = this.store.series() ?? [];
  }

  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  setDataSourceAttributes() {
    this.dataSource.paginator = this.paginator;
  }

  create() {
    const dialog = this.dialog.open(SeriesFormDialogComponent, {
      disableClose: true
    });

    dialog.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;
        this.reload();
      }
    });
  }

  edit(row: Serie) {
    const dialog = this.dialog.open(SeriesFormDialogComponent, {
      disableClose: true,
      data: row
    });

    dialog.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;
        this.reload();
      }
    });
  }

  delete(row: Serie) {
    const dialog = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar serie',
        message: `¿Seguro que deseas eliminar la serie ${row.serieNumber}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        color: 'warn'
      }
    });

    dialog.afterClosed().subscribe({
      next: (confirmed) => {
        if (!confirmed) return;

        this.seriesService.delete(row).subscribe({
          next: () => {
            this.toastr.success('Serie eliminada exitosamente');
            this.store.remove(row.id);
            this.dataSource.data = this.store.series()!;
          }
        });
      }
    });
  }

  private reload() {
    this.store.setLoading(true);

    this.seriesService.getAll()
      .pipe(finalize(() => this.store.setLoading(false)))
      .subscribe(data => {
        this.store.set(data);
        this.dataSource.data = data;
      });
  }

}
