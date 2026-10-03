import { AfterViewInit, Directive, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { ListStore } from 'src/app/core/stores/crud.store';

/** Reporte de un mes completo con paginación en cliente: se elige el mes y se consulta todo de una vez. */
@Directive()
export abstract class ReporteMensual<T> implements OnInit, AfterViewInit {

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    private fb = inject(UntypedFormBuilder);

    protected abstract readonly store: ListStore<T>;

    protected abstract consultar(anio: number, mes: number): Observable<T[]>;

    form: FormGroup = this.fb.group({
        month: [new Date(), Validators.required],
    });

    items: T[] = [];

    pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    currentPage = 0;

    ngOnInit(): void {
        const data = this.store.items();

        if (data?.length) {
            this.items = data;
        }
    }

    ngAfterViewInit(): void {
        this.paginator.page.subscribe((event) => {
            this.pageSize = event.pageSize;
            this.currentPage = event.pageIndex;
        });
    }

    get month(): FormControl {
        return this.form.get('month') as FormControl;
    }

    applyFilter(): void {
        if (this.form.invalid) return;

        // Eran 61 KB de moment —y CommonJS— para leer el mes y el anio de un Date que ya trae el datepicker.
        const mountDate = new Date(this.form.value.month);
        const month = mountDate.getMonth() + 1;
        const year = mountDate.getFullYear();

        this.store.setLoading(true);

        this.consultar(year, month)
            .pipe(
                finalize(() => this.store.setLoading(false))
            )
            .subscribe({
                next: (data) => {
                    this.items = data ?? [];
                    this.currentPage = 0;
                    this.paginator.firstPage();
                },
                error: () => {
                    this.items = [];
                },
            });
    }

    get pagedData(): T[] {
        const start = this.currentPage * this.pageSize;
        return this.items.slice(start, start + this.pageSize);
    }

    onPageChange(event: any): void {
        if (event.pageSize !== this.pageSize) {
            this.currentPage = 0;
            this.paginator.firstPage();
        } else {
            this.currentPage = event.pageIndex;
        }
        this.pageSize = event.pageSize;
    }
}
