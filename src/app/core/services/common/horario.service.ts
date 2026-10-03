import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface HorarioAtencion {
    days: {
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
        note: string | null;
    }[];
    /** Ya redactado y agrupado por el servidor: "Lun – Vie: 09:00 – 18:00". */
    lines: string[];
    openNow: boolean;
    /** Nombre del feriado si hoy lo es. Manda sobre el horario semanal. */
    todayHoliday: string | null;
}

/** Horario de atención del API, con líneas de respaldo para que el menú no quede vacío si no responde. */
@Injectable({ providedIn: 'root' })
export class HorarioService {

    private http = inject(HttpClient);

    private readonly RESPALDO: string[] = [
        'Lun – Vie: 09:00 – 18:00',
        'Sáb: 09:00 – 13:00',
    ];

    readonly lineas = signal<string[]>(this.RESPALDO);
    readonly abierto = signal<boolean | null>(null);
    readonly feriado = signal<string | null>(null);

    private pedido = false;

    cargar(): void {
        if (this.pedido) return;
        this.pedido = true;

        this.http.get<HorarioAtencion>(`${environment.apiUrl}/api/business-hours/public`)
            .pipe(catchError(() => of(null)))
            .subscribe(res => {
                if (!res?.lines?.length) return;
                this.lineas.set(res.lines);
                this.abierto.set(res.openNow);
                this.feriado.set(res.todayHoliday ?? null);
            });
    }
}
