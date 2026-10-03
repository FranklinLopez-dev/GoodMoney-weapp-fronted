import { aFechaApi } from 'src/app/shared/utils/fechas';
import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ExchangeRate } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateStore } from './exchange-rate.store';
import { ExchangeRatesDialogComponent } from './exchange-rate-dialog.component';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { MatPaginator } from '@angular/material/paginator';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { MatDialog } from '@angular/material/dialog';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Component({
    selector: 'app-exchange-rate',
    standalone: true,
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        DateMaskDirective
    ],
    templateUrl: './exchange-rate.component.html'
})
export class ExchangeRateComponent implements OnInit {
    @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }

    private service = inject(ExchangeRateService);
    protected store = inject(ExchangeRateStore);
    private authStore = inject(AuthStore);
    private fb = inject(FormBuilder);

    displayedColumns = ['num', 'dateRegister', 'priceCompra', 'priceVenta', 'user'];
    private paginator: MatPaginator;
    dataSource = new MatTableDataSource<ExchangeRate>();

    readonly Permission = Permission;
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;

    form = this.fb.nonNullable.group({
        fromDate: [new Date(), Validators.required],
        toDate: [new Date(), Validators.required]
    },
        {
            validators: [
                rangeValidator('fromDate', 'toDate', 'date')
            ]
        }
    );

    get control() {
        return this.form.controls;
    }

    constructor(private toastr: ToastrService, public dialog: MatDialog) {

    }

    ngOnInit() {
        this.updateDataSource();
    }

    public loadData(force = false): void {
        if (!this.form.valid) {
            this.toastr.warning('Por favor complete las fechas correctamente');
            return;
        }

        const v = this.form.value;
        const fromDate = aFechaApi(new Date(v.fromDate!));
        const toDate = aFechaApi(new Date(v.toDate!));

        const cached = this.store.getFromCache(fromDate, toDate);
        if (cached && !force) {
            this.store.set(cached);
            this.updateDataSource();
            return;
        }

        this.store.setLoading(true);
        this.service.getAll(fromDate, toDate)
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: (data) => {
                    this.store.setToCache(fromDate, toDate, data);
                    this.store.set(data);
                    this.updateDataSource();
                }
            });
    }

    private updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }

    private setDataSourceAttributes() {
        this.dataSource.paginator = this.paginator;
    }

    openCreate(): void {
        const dialog = this.dialog.open(ExchangeRatesDialogComponent, {
            disableClose: true
        });

        dialog.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;

                this.service.create(result).subscribe({
                    next: () => {
                        this.store.clear();
                        this.loadData();
                        this.toastr.success('Tipo de cambio guardado correctamente', 'Éxito');
                    },
                });
            }
        });
    }

    canCreate(): boolean {
        return this.authStore.hasPermission(Permission.ExchangeRatesCreate);
    }
}
