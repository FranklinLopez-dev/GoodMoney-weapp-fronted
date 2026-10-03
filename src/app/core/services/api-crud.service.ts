import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/** CRUD contra `/api/<recurso>`: el id viaja en el cuerpo (también en DELETE) y el backend responde texto plano. */
export abstract class ApiCrudService<T, TCreado = string> {
    protected readonly http = inject(HttpClient);
    protected readonly baseUrl: string;

    protected constructor(recurso: string) {
        this.baseUrl = `${environment.apiUrl}/api/${recurso}`;
    }

    getAll(): Observable<T[]> {
        return this.http.get<T[]>(this.baseUrl);
    }

    /** `TCreado` existe para los recursos cuyo POST responde JSON; esos sobreescriben este método. */
    create(data: Partial<T>): Observable<TCreado> {
        return this.http.post(this.baseUrl, data, { responseType: 'text' }) as Observable<TCreado>;
    }

    update(data: Partial<T>): Observable<string> {
        return this.http.put(this.baseUrl, data, { responseType: 'text' });
    }

    delete(data: Partial<T>): Observable<string> {
        return this.http.delete(this.baseUrl, { body: data, responseType: 'text' });
    }
}
