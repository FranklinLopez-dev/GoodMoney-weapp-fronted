import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { ToastrService } from 'ngx-toastr';
import { BlackList } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { RouterModule } from '@angular/router';
import { BlackListService } from './black-list.service';
import { BlackListStore } from './black-list.store';
import { BlackListDialogComponent } from './black-list-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { ExportadorReportesService } from 'src/app/shared/services/exportador-reportes.service';
import { BotonesExportarComponent } from 'src/app/shared/components/botones-exportar/botones-exportar.component';
import { COLUMNAS_PDF_LISTA_NEGRA } from './lista-negra-pdf';

@Component({
    selector: 'app-black-list',
    standalone: true,
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        RouterModule,
        BotonesExportarComponent
    ],
    templateUrl: './black-list.component.html'
})
export class BlackListComponent implements OnInit {

    private service = inject(BlackListService);
    protected store = inject(BlackListStore);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    private exportador = inject(ExportadorReportesService);

    displayedColumns: string[] = ['num', 'document', 'email', 'reason', 'action'];

    dataSource = new MatTableDataSource<BlackList>();
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());

    searchControl = new FormControl('');

    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.updateDataSource();

        this.searchControl.valueChanges
            .pipe(conPausaDeTipeo(), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.cargarData());
    }


    private updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }

    cargarData() {
        this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
        this.loadData();
    }


    loadData(): void {
        this.store.setLoading(true);
        const searchTerm = this.searchControl.value ?? '';

        this.service.search(
            searchTerm,
            this.pageIndex(),
            this.pageSize()
        )
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: response => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.store.set(data);
                    this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    private busquedaActual(): string {
        return (this.searchControl.value ?? '').trim();
    }

    exportarExcel(): void {
        this.exportador.excel(this.service.excel(this.busquedaActual()), 'REPORTE-LISTA-NEGRA');
    }

    exportarPdf(): void {
        const busqueda = this.busquedaActual();

        this.exportador.pdf(this.service.registrosParaReporte(busqueda), 'REPORTE-LISTA-NEGRA', {
            titulo: 'REPORTE DE LISTA NEGRA',
            columnas: COLUMNAS_PDF_LISTA_NEGRA,
            filtros: busqueda ? `Búsqueda "${busqueda}"` : 'Ninguno (todos los registros)',
        });
    }

    create() {
        const dialogRef = this.dialog.open(BlackListDialogComponent, {
            disableClose: true,
            width: '500px',
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;
                this.loadData();
            },
        });
    }

    delete(item: BlackList): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Eliminar usuario',
                message: `¿Estás seguro que deseas eliminar este usuario de la lista negra?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.service.delete(item.id).subscribe({
                    next: () => {
                        this.toastr.success('Usuario eliminado de la lista negra');
                        this.loadData();
                    }
                });
            },
        });
    }

}
