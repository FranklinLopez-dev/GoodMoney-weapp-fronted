import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { format } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, Observable } from 'rxjs';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { descargarArchivo } from 'src/app/shared/utils/descargas';
import type { ColumnaPdf } from 'src/app/shared/utils/reporte-pdf';

export interface ReportePdf<T> {
    titulo: string;
    columnas: ColumnaPdf<T>[];
    filtros: string;
}

@Injectable({ providedIn: 'root' })
export class ExportadorReportesService {

    private toastr = inject(ToastrService);
    private appData = inject(UtilsService);

    readonly enCurso = signal<'pdf' | 'excel' | null>(null);

    /** `nombre` sin fecha ni extensión, p. ej. `REPORTE-CLIENTES`. */
    async excel(archivo: Observable<Blob>, nombre: string): Promise<void> {
        if (this.enCurso()) return;

        this.enCurso.set('excel');
        try {
            descargarArchivo(await lastValueFrom(archivo), this.nombreDeArchivo(nombre, 'xlsx'));
        } catch (error) {
            this.avisar(error, 'No se pudo generar el Excel.');
        } finally {
            this.enCurso.set(null);
        }
    }

    async pdf<T>(consulta: Observable<T[]>, nombre: string, reporte: ReportePdf<T>): Promise<void> {
        if (this.enCurso()) return;

        this.enCurso.set('pdf');
        try {
            // El generador arrastra jsPDF (~400 KB): se pide al pulsar y baja en paralelo con la consulta.
            const [filas, { generarReportePdf }] = await Promise.all([
                lastValueFrom(consulta),
                import('src/app/shared/utils/reporte-pdf'),
            ]);

            if (!filas.length) {
                this.toastr.info('No hay registros que coincidan con los filtros.');
                return;
            }

            generarReportePdf(filas, {
                ...reporte,
                empresa: this.appData.company()?.name ?? '',
                logoBase64: this.appData.company()?.logo ?? null,
                nombreArchivo: this.nombreDeArchivo(nombre, 'pdf'),
            });
        } catch (error) {
            this.avisar(error, 'No se pudo generar el PDF.');
        } finally {
            this.enCurso.set(null);
        }
    }

    private nombreDeArchivo(nombre: string, extension: 'pdf' | 'xlsx'): string {
        return `${nombre}-${format(new Date(), 'yyyyMMdd-HHmm')}.${extension}`;
    }

    private avisar(error: unknown, mensaje: string): void {
        // Los fallos HTTP ya los avisa el interceptor.
        if (!(error instanceof HttpErrorResponse)) {
            this.toastr.error(mensaje);
        }
    }
}
