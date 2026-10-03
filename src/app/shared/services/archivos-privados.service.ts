import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { SIN_AVISOS } from 'src/app/core/interceptors/sin-avisos';
import { environment } from 'src/environments/environment';

/**
 * Fotos de perfil, documentos de identidad e imágenes del chat y del libro de
 * reclamaciones. Son privados: un `<img src>` no lleva el token, así que se
 * piden con sesión al API y se muestran como URL local (`blob:`).
 *
 * Cada ruta se pide una sola vez por sesión del navegador: la misma foto
 * aparece en muchas filas de una lista.
 */
@Injectable({ providedIn: 'root' })
export class ArchivosPrivadosService {

    private http = inject(HttpClient);
    private cache = new Map<string, Observable<string | null>>();

    /** URL lista para `src`/`href`, o null si no hay archivo o no se puede ver. */
    url(ruta: string | null | undefined): Observable<string | null> {
        if (!ruta) return of(null);
        if (/^(https?:|blob:|data:)/.test(ruta)) return of(ruta);

        const relativa = ruta.replace(/\\/g, '/').replace(/^\/+/, '');
        // Los logos de la empresa son públicos y se sirven tal cual.
        if (relativa.startsWith('files/public/')) return of(`${environment.apiUrl}/${relativa}`);

        let pedido = this.cache.get(relativa);
        if (!pedido) {
            pedido = this.http.get(`${environment.apiUrl}/api/archivos`, {
                params: { ruta: relativa },
                responseType: 'blob',
                context: new HttpContext().set(SIN_AVISOS, true),
            }).pipe(
                map(blob => URL.createObjectURL(blob)),
                catchError(() => of(null)),
                shareReplay(1),
            );
            this.cache.set(relativa, pedido);
        }
        return pedido;
    }

    /** Al cerrar sesión: libera las URLs locales y no deja imágenes del usuario anterior. */
    limpiar(): void {
        for (const pedido of this.cache.values()) {
            pedido.subscribe(url => url?.startsWith('blob:') && URL.revokeObjectURL(url));
        }
        this.cache.clear();
    }
}
