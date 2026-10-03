import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { Ubigeo } from '../../models';

/** Cómo viene el árbol en assets/data/ubigeos.json. */
interface NodoDepartamento {
    n: string;
    p: Record<string, { n: string; d: Record<string, string> }>;
}

/** JSON estático: el API recorría 2077 filas para 25 departamentos. Regenerar con `tools/generar-ubigeos.mjs`. */
@Injectable({ providedIn: 'root' })
export class UbigeosService {

    private http = inject(HttpClient);

    private _departments = signal<Ubigeo[]>([]);
    readonly departments = this._departments.asReadonly();

    /** Una sola descarga por sesión, compartida entre todos los que la pidan. */
    private arbol$ = this.http
        .get<Record<string, NodoDepartamento>>('assets/data/ubigeos.json')
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));

    getDepartments(): Observable<Ubigeo[]> {
        return this.arbol$.pipe(
            map(arbol =>
                Object.entries(arbol)
                    .map(([dd, nodo]) => this.aUbigeo(`${dd}0000`, nodo.n, '', ''))
                    .sort((a, b) => a.departament.localeCompare(b.departament))
            ),
            tap(res => this._departments.set(res))
        );
    }

    getProvinces(departmentCode: string): Observable<Ubigeo[]> {
        const dd = (departmentCode ?? '').slice(0, 2);
        if (!dd) return of([]);

        return this.arbol$.pipe(
            map(arbol => {
                const nodo = arbol[dd];
                if (!nodo) return [];

                return Object.entries(nodo.p)
                    .map(([pp, prov]) => this.aUbigeo(`${dd}${pp}00`, nodo.n, prov.n, ''))
                    .sort((a, b) => a.province.localeCompare(b.province));
            })
        );
    }

    getDistricts(provinceCode: string): Observable<Ubigeo[]> {
        const dd = (provinceCode ?? '').slice(0, 2);
        const pp = (provinceCode ?? '').slice(2, 4);
        if (!dd || !pp) return of([]);

        return this.arbol$.pipe(
            map(arbol => {
                const prov = arbol[dd]?.p[pp];
                if (!prov) return [];

                return Object.entries(prov.d)
                    .map(([tt, nombre]) => this.aUbigeo(`${dd}${pp}${tt}`, arbol[dd].n, prov.n, nombre))
                    .sort((a, b) => a.district.localeCompare(b.district));
            })
        );
    }

    /** Nombre completo a partir del código, para pintar direcciones ya guardadas. */
    describir(code: string): Observable<string> {
        return this.arbol$.pipe(
            map(arbol => {
                const dd = code?.slice(0, 2), pp = code?.slice(2, 4), tt = code?.slice(4, 6);
                const dep = arbol[dd];
                if (!dep) return '';
                const prov = dep.p[pp];
                if (!prov) return dep.n;
                const dist = prov.d[tt];
                return dist ? `${dist}, ${prov.n}, ${dep.n}` : `${prov.n}, ${dep.n}`;
            })
        );
    }

    private aUbigeo(code: string, departament: string, province: string, district: string): Ubigeo {
        // `id` no lo usa ningún consumidor: los selectores enlazan por `code`.
        return { id: 0, code, departament, province, district };
    }
}
