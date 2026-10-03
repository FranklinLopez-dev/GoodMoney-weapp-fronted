import { computed, signal } from '@angular/core';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

/** Estado en memoria de un listado: los componentes leen las señales y quien carga escribe. */
export abstract class ListStore<T> {

    private _items = signal<T[] | null>(null);
    private _loading = signal(false);

    readonly items = this._items.asReadonly();
    readonly loading = this._loading.asReadonly();

    hasData = computed(() => !!this._items()?.length);

    set(items: T[]) {
        this._items.set(structuredClone(items));
    }

    clear() {
        this._items.set(null);
    }

    setLoading(value: boolean) {
        this._loading.set(value);
    }

    protected setItems(items: T[] | null) {
        this._items.set(items);
    }

    protected getItems(): T[] | null {
        return this._items();
    }
}

/** Listado editable en memoria: altas, ediciones y bajas puntuales sin recargar del backend. */
export abstract class CrudStore<T extends { id: TId }, TId = number> extends ListStore<T> {

    add(item: T) {
        const current = this.getItems() ?? [];
        this.setItems([...current, item]);
    }

    update(item: T) {
        const current = this.getItems();
        if (!current) return;

        this.setItems(
            current.map(i => i.id === item.id ? item : i)
        );
    }

    remove(id: TId) {
        const current = this.getItems();
        if (!current) return;

        this.setItems(current.filter(i => i.id !== id));
    }
}

/** Listado paginado en servidor: guarda además el total y la página vigente. */
export abstract class PagedListStore<T extends { id: TId }, TId = number> extends ListStore<T> {

    private _totalRecords = signal(0);
    private _pageIndex = signal(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
    private _pageSize = signal(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

    readonly totalRecords = this._totalRecords.asReadonly();
    readonly pageIndex = this._pageIndex.asReadonly();
    readonly pageSize = this._pageSize.asReadonly();

    setPagination(totalRecords: number, pageIndex: number, pageSize: number) {
        this._totalRecords.set(totalRecords);
        this._pageIndex.set(pageIndex);
        this._pageSize.set(pageSize);
    }

    findById(id: TId) {
        return computed(() =>
            this.items()?.find(i => i.id === id) ?? null
        );
    }

    override clear() {
        super.clear();
        this._totalRecords.set(0);
        this._pageIndex.set(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
        this._pageSize.set(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    }
}
