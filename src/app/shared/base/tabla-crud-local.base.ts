import { Directive, Signal, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

/** Lo mínimo que la tabla exige de su store; estructural para no atar el componente a una jerarquía concreta. */
export interface StoreDeTabla<T> {
    readonly items: Signal<T[] | null>;
    readonly loading: Signal<boolean>;
    set(items: T[]): void;
    setLoading(value: boolean): void;
}

/** Tabla de catálogo con todos los datos en memoria: Material pagina y filtra; `reload` refresca del backend. */
@Directive()
export abstract class TablaCrudLocal<T> {

    @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }
    private paginator: MatPaginator;

    dataSource = new MatTableDataSource<T>([]);
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;

    protected abstract readonly store: StoreDeTabla<T>;
    protected abstract readonly service: { getAll(): Observable<T[]> };

    get loading() {
        return this.store.loading;
    }

    protected updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }

    setDataSourceAttributes() {
        this.dataSource.paginator = this.paginator;
    }

    applyFilter(value: string) {
        this.dataSource.filter = value.trim().toLowerCase();
    }

    protected reload() {
        this.store.setLoading(true);

        this.service.getAll()
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe(data => {
                this.store.set(data);
                this.dataSource.data = data;
            });
    }
}
