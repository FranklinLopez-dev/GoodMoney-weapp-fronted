import { Observable, tap } from 'rxjs';

/** Precarga el catálogo en su store antes de activar la ruta. */
export abstract class CatalogoResolver<T> {

    protected abstract readonly service: { getAll(): Observable<T[]> };
    protected abstract readonly store: { set(items: T[]): void };

    resolve(): Observable<T[]> {
        return this.service.getAll().pipe(
            tap(data => this.store.set(data))
        );
    }
}
