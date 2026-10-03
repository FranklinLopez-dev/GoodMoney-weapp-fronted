import { CommonModule } from '@angular/common';
import {
    AfterViewChecked,
    Component,
    ElementRef,
    ViewChild,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AsistenteFaq, AsistenteService } from './asistente.service';

interface Mensaje {
    de: 'bot' | 'usuario';
    texto: string;
    hora: string;
    /** El primer mensaje de una tanda del bot lleva el avatar; el resto no. */
    conAvatar?: boolean;
}

/** No hay IA: el matching es por palabras clave y sin respuesta se ofrece un asesor por WhatsApp. */
@Component({
    selector: 'app-asistente',
    standalone: true,
    imports: [CommonModule, FormsModule, TablerIconsModule],
    templateUrl: './asistente.component.html',
    styleUrls: ['./asistente.component.scss'],
})
export class AsistenteComponent implements AfterViewChecked {

    private service = inject(AsistenteService);

    @ViewChild('cuerpo') private cuerpo?: ElementRef<HTMLElement>;

    private readonly WHATSAPP = 'https://wa.me/51920001085';

    /** La consulta que el bot no supo responder: viaja ya escrita al asesor. */
    private ultimaConsulta = '';

    enlaceAsesor(): string {
        const texto = this.ultimaConsulta
            ? `Hola 👋, tengo una consulta: ${this.ultimaConsulta}`
            : 'Hola 👋, vengo del asistente virtual y tengo una consulta.';
        return `${this.WHATSAPP}?text=${encodeURIComponent(texto)}`;
    }

    abierto = signal(false);
    escribiendo = signal(false);
    mensajes = signal<Mensaje[]>([]);
    sugerencias = signal<AsistenteFaq[]>([]);
    texto = '';

    private faqs: AsistenteFaq[] = [];
    private cargado = false;
    private debeBajar = false;

    alternar(): void {
        this.abierto.update(v => !v);

        if (this.abierto() && !this.cargado) {
            this.cargado = true;

            // Si hay conversación de antes se recupera; si no, se saluda.
            if (!this.recuperar()) this.saludar();

            this.service.getFaqs().subscribe(faqs => {
                this.faqs = faqs;
                this.sugerencias.set(faqs.slice(0, 4));
            });
        }

        this.debeBajar = true;
    }

    /** Vacía la conversación y vuelve a empezar. */
    limpiar(): void {
        this.mensajes.set([]);
        this.conAsesor.set(false);
        this.ultimaConsulta = '';
        sessionStorage.removeItem(AsistenteComponent.CLAVE);
        this.saludar();
    }

    preguntar(faq: AsistenteFaq): void {
        this.pushUsuario(faq.question);
        this.responder(faq.answer);
    }

    enviar(): void {
        const consulta = this.texto.trim();
        if (!consulta) return;
        this.texto = '';
        this.pushUsuario(consulta);

        const candidatos = this.buscar(consulta);

        if (candidatos.length) {
            this.responder(candidatos[0].answer);
            // Las siguientes mejores quedan a mano: si se quedó cerca, evitan tener que reformular la pregunta.
            this.sugerencias.set(candidatos.slice(1, 4));
            return;
        }

        // Sin ninguna coincidencia no se deja al usuario en un callejón: las más consultadas y el paso a un asesor.
        this.ultimaConsulta = consulta;
        this.sugerencias.set(this.faqs.slice(0, 3));
        this.responder(
            'Esa no me la sé 😅. Mira si alguna de estas te sirve; si no, ' +
            'un asesor te responde al toque por WhatsApp.',
            true
        );
    }

    conAsesor = signal(false);

    ngAfterViewChecked(): void {
        if (this.debeBajar && this.cuerpo) {
            this.cuerpo.nativeElement.scrollTop = this.cuerpo.nativeElement.scrollHeight;
            this.debeBajar = false;
        }
    }

    // privados

    private saludar(): void {
        this.pushBot(
            'Hola, soy Good Money 🎩. Estoy aquí para ayudarte en lo que necesites ' +
            'de manera rápida y simple. Y si lo prefieres, también puedes ' +
            'comunicarte con uno de nuestros asesores 😊',
            true
        );
        this.pushBot('¿En qué puedo ayudarte?');
    }

    /** Entre 900 ms y 2 s según lo larga que sea la respuesta: en 600 ms fijos no se veía quién hablaba. */
    private responder(texto: string, ofrecerAsesor = false): void {
        this.escribiendo.set(true);
        this.debeBajar = true;

        const espera = Math.min(2000, 900 + texto.length * 6);

        setTimeout(() => {
            this.escribiendo.set(false);
            this.pushBot(texto, true);
            this.conAsesor.set(ofrecerAsesor);
            this.debeBajar = true;
            this.guardar();
        }, espera);
    }

    /** Puntúa por palabras que coinciden, también contra la respuesta con menos peso, por raíz de 4 letras. */
    private buscar(consulta: string): AsistenteFaq[] {
        const palabras = this.normalizar(consulta).split(/\s+/).filter(p => p.length > 2);
        if (!palabras.length) return [];

        const puntuadas = this.faqs.map(faq => {
            const claves = this.normalizar(`${faq.keywords ?? ''},${faq.question}`);
            const respuesta = this.normalizar(faq.answer);

            let puntaje = 0;
            for (const palabra of palabras) {
                const raiz = palabra.slice(0, 4);
                if (claves.includes(raiz)) puntaje += 2;
                else if (respuesta.includes(raiz)) puntaje += 1;
            }

            return { faq, puntaje };
        });

        return puntuadas
            .filter(p => p.puntaje >= 2)
            .sort((a, b) => b.puntaje - a.puntaje)
            .map(p => p.faq);
    }

    private normalizar(s: string): string {
        return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    private pushBot(texto: string, conAvatar = false): void {
        this.mensajes.update(m => [...m, { de: 'bot', texto, hora: this.ahora(), conAvatar }]);
        this.debeBajar = true;
        this.guardar();
    }

    private pushUsuario(texto: string): void {
        this.mensajes.update(m => [...m, { de: 'usuario', texto, hora: this.ahora() }]);
        this.conAsesor.set(false);
        this.debeBajar = true;
        this.guardar();
    }

    // `sessionStorage` y no `localStorage`: muere al cerrar la pestaña, que en un ordenador compartido hace falta.

    private static readonly CLAVE = 'gm-asistente';
    private static readonly TOPE = 50;

    private guardar(): void {
        try {
            const ultimos = this.mensajes().slice(-AsistenteComponent.TOPE);
            sessionStorage.setItem(AsistenteComponent.CLAVE, JSON.stringify(ultimos));
        } catch {
            // Con el almacenamiento bloqueado el chat sigue vivo en memoria: no es motivo para romper nada.
        }
    }

    /** @returns true si había algo que recuperar. */
    private recuperar(): boolean {
        try {
            const crudo = sessionStorage.getItem(AsistenteComponent.CLAVE);
            if (!crudo) return false;

            const guardados = JSON.parse(crudo) as Mensaje[];
            if (!Array.isArray(guardados) || !guardados.length) return false;

            this.mensajes.set(guardados);
            return true;
        } catch {
            return false;
        }
    }

    private ahora(): string {
        return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
}
