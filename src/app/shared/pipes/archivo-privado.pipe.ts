import { inject, Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { ArchivosPrivadosService } from '../services/archivos-privados.service';

/**
 * `[src]="perfil.profilePhoto | archivoPrivado | async"`: muestra un archivo
 * guardado por el API (ruta `files/...`) pidiéndolo con la sesión del usuario.
 */
@Pipe({ name: 'archivoPrivado', standalone: true })
export class ArchivoPrivadoPipe implements PipeTransform {

    private archivos = inject(ArchivosPrivadosService);

    transform(ruta: string | null | undefined): Observable<string | null> {
        return this.archivos.url(ruta);
    }
}
