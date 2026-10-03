import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Auditoriums } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuditoriumsService } from './auditoriums.service';
import { AuditoriumsStore } from './auditoriums.store';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { ModalLocationComponent } from './location/location.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-auditoriums',
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        DateMaskDirective
    ],
    templateUrl: './auditoriums.component.html'
})
export class AuditoriumsComponent implements OnInit {

    private service = inject(AuditoriumsService);
    protected store = inject(AuditoriumsStore);
    private fb = inject(FormBuilder);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);

    displayedColumns = [
        'num',
        'date',
        'applicationUser',
        'targetUser',
        'category',
        'action',
        'ipAddress',
        'location',
        'dispositivo',
        'dispositivoType',
        'plataforma',
        'browser',
    ];

    dataSource = new MatTableDataSource<Auditoriums>();
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());

    form = this.fb.nonNullable.group(
        {
            fromDate: [new Date(), Validators.required],
            toDate: [new Date(), Validators.required]
        },
        {
            validators: [rangeValidator('fromDate', 'toDate', 'date')]
        }
    );

    get control() {
        return this.form.controls;
    }

    ngOnInit(): void {
        this.updateDataSource();
    }

    private updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }

    loadData(): void {

        if (!this.form.valid) {
            return;
        }

        const v = this.form.getRawValue();

        const startDate = aFechaApi(v.fromDate);
        const endDate = aFechaApi(v.toDate);

        this.store.setLoading(true);

        this.service.search(
            this.pageIndex(),
            this.pageSize(),
            startDate,
            endDate
        )
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: response => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.store.set(data);
                    this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                },
                error: () => {
                    this.toastr.error('Error al cargar los auditoriums');
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    verLocation(element: any) {
        this.dialog.open(ModalLocationComponent, {
            disableClose: true,
            width: '640px',
            maxWidth: '95vw',
            data: element,
        });
    }


}
