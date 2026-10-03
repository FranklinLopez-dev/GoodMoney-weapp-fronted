import { MonoTypeOperatorFunction, debounceTime, distinctUntilChanged, pipe } from 'rxjs';

/** Pausa de tipeo de los buscadores que consultan al backend. */
export const PAUSA_BUSQUEDA = 400;

/** Un buscador de backend dispara solo al dejar de teclear; Enter sigue valiendo para no esperar la pausa. */
export function conPausaDeTipeo<T>(): MonoTypeOperatorFunction<T> {
    return pipe(debounceTime(PAUSA_BUSQUEDA), distinctUntilChanged());
}
