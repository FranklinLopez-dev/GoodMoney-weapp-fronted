import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AsistenteFaq {
    id: number;
    question: string;
    answer: string;
    keywords: string | null;
    displayOrder: number;
    isActive?: boolean;
}

/** Vienen del API, pero si falla responde con un juego mínimo local: el widget nunca debe quedarse mudo. */
@Injectable({ providedIn: 'root' })
export class AsistenteService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/assistant-faqs`;

    private readonly FALLBACK: AsistenteFaq[] = [
        {
            id: -1,
            question: '¿Cómo cambio mis dólares?',
            answer: 'Es muy fácil: 1) Cotiza el monto y el tipo de cambio, 2) Registra tu operación eligiendo tus cuentas, 3) Transfiere desde tu banco, y 4) Adjunta el voucher y finaliza. Nosotros te depositamos el cambio.',
            keywords: 'cambiar,cambio,dolares,operacion,pasos,como',
            displayOrder: 1,
        },
        {
            id: -2,
            question: '¿Cuál es el horario de atención?',
            answer: 'Atendemos de lunes a viernes de 09:00 a 18:00 y los sábados de 09:00 a 13:00.',
            keywords: 'horario,atencion,hora,abierto,dias',
            displayOrder: 2,
        },
        {
            id: -3,
            question: '¿Cuánto demora una operación?',
            answer: 'Las transferencias inmediatas se procesan en unos 15 minutos. Las interbancarias pueden tomar hasta 24 horas, según tu banco.',
            keywords: 'demora,tiempo,minutos,horas,transferencia,rapido',
            displayOrder: 3,
        },
    ];

    getFaqs(): Observable<AsistenteFaq[]> {
        return this.http.get<AsistenteFaq[]>(`${this.baseUrl}/public`).pipe(
            catchError(() => of(this.FALLBACK))
        );
    }
}
