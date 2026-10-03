import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { environment } from 'src/environments/environment';

interface OperacionDj {
    codigo: string;
    dateCreation: string;
    tipo: string;
    monto: number;
    tipoCambio: number;
    total: number;
    cliente: string;
    esPersonaNatural: boolean;
    isPep: boolean;
    isFamiliarPep: boolean;
    cargo: string | null;
    institution: string | null;
    statusCivil: string | null;
    venceAt: string;
    yaFirmada: boolean;
}

/**
 * Firma de la declaración jurada por enlace, sin iniciar sesión: el operador registró la operación y el
 * cliente recibe por correo este enlace (una operación, 72 horas, una sola vez). Mismas preguntas que el
 * formulario del cotizador; aceptar la declaración vale como firma.
 */
@Component({
    selector: 'app-firma-dj',
    standalone: true,
    imports: [CommonModule, FormsModule, MaterialModule],
    templateUrl: './firma-dj.component.html',
    styleUrls: ['./firma-dj.component.scss'],
})
export class FirmaDjComponent {
    private http = inject(HttpClient);
    /** Del fragmento (#token): el navegador no lo manda a ningún servidor. Se quita de la barra al leerlo. */
    private token = (inject(ActivatedRoute).snapshot.fragment ?? '').trim();
    private url = `${environment.apiUrl}/api/public/dj`;

    readonly operacion = signal<OperacionDj | null>(null);
    readonly error = signal<string | null>(null);
    readonly cargando = signal(true);
    readonly enviando = signal(false);
    readonly firmada = signal(false);

    readonly origenes = [
        '001:AHORROS', '002:ALQUILER DE BIENES MUEBLES', '003:ALQUILER DE BIENES INMUEBLES', '004:DONACION / SORTEO',
        '005:INGRESOS POR TRABAJO INDEPENDIENTE', '006:INGRESOS POR TRABAJO DEPENDIENTE', '007:INGRESOS POR REGALIA',
        '008:PRÉSTAMOS', '009:VENTA DE BIEN MUEBLE', '010:VENTA DE BIEN INMUEBLE', '099:OTROS',
    ];

    // Respuestas
    origenFondos = '';
    origenFondosOtros = '';
    proposito = 'Compra y venta de moneda extranjera';
    estadoCivil = '';
    conyuge = '';
    esPep = false;
    pepHistorico: boolean | null = null;
    pepColaborador: string | null = null;
    pepCargo = '';
    pepInstitucion = '';
    esFamiliarPep = false;
    familiares: { nombres: string; parentesco: string }[] = [{ nombres: '', parentesco: '' }];
    acepta = false;

    constructor() {
        if (this.token) history.replaceState(null, '', location.pathname);
        if (!this.token) {
            this.cargando.set(false);
            this.error.set('El enlace está incompleto. Ábrelo desde el correo que te enviamos.');
            return;
        }
        this.http.post<OperacionDj>(`${this.url}/consultar`, { token: this.token }).pipe(finalize(() => this.cargando.set(false))).subscribe({
            next: o => {
                if (o.yaFirmada) { this.firmada.set(true); return; }
                this.operacion.set(o);
                this.esPep = o.isPep;
                this.esFamiliarPep = o.isFamiliarPep;
                this.pepCargo = o.cargo ?? '';
                this.pepInstitucion = o.institution ?? '';
                this.estadoCivil = o.statusCivil ?? '';
            },
            error: (e: HttpErrorResponse) => this.error.set(typeof e.error === 'string' ? e.error : 'No se pudo abrir el enlace.'),
        });
    }

    get declaraPep(): boolean {
        return this.esPep || this.pepHistorico === true || this.pepColaborador === 'SI_SOY' || this.pepColaborador === 'SI_HE_SIDO';
    }

    agregarFamiliar(): void { this.familiares.push({ nombres: '', parentesco: '' }); }
    quitarFamiliar(i: number): void { this.familiares.splice(i, 1); }

    firmar(): void {
        this.error.set(null);
        this.enviando.set(true);
        const cuerpo = {
            origenFondos: this.origenFondos,
            origenFondosOtros: this.origenFondos.startsWith('099') ? this.origenFondosOtros : null,
            proposito: this.proposito,
            estadoCivil: this.estadoCivil || null,
            conyuge: this.conyuge || null,
            esPep: this.esPep,
            pepHistorico: this.pepHistorico,
            pepColaborador: this.pepColaborador,
            pepCargo: this.declaraPep ? this.pepCargo : null,
            pepInstitucion: this.declaraPep ? this.pepInstitucion : null,
            parientesPep: [],
            esFamiliarPep: this.esFamiliarPep,
            familiaresPep: this.esFamiliarPep ? this.familiares.filter(f => f.nombres.trim()) : [],
            acepta: this.acepta,
        };
        this.http.post(`${this.url}/firmar`, { token: this.token, declaracion: cuerpo }).pipe(finalize(() => this.enviando.set(false))).subscribe({
            next: () => this.firmada.set(true),
            error: (e: HttpErrorResponse) => {
                if (e.status === 409) { this.firmada.set(true); return; }
                this.error.set(typeof e.error === 'string' ? e.error : 'No se pudo firmar. Inténtalo de nuevo.');
            },
        });
    }
}
