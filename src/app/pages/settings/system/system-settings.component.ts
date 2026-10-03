import { PublicacionTipoCambioComponent } from './publicacion-tipo-cambio.component';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { EstadoWhatsApp, QrWhatsApp, SystemSettings, SystemSettingsService } from './system-settings.service';

/** Los secretos nunca se pintan, "activo" lo calcula el servidor y el QR se tira tras pintarlo: vincula un teléfono. */
@Component({
    selector: 'app-system-settings',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule, TablerIconsModule, PublicacionTipoCambioComponent],
    templateUrl: './system-settings.component.html',
    styleUrls: ['./system-settings.component.scss'],
})
export class SystemSettingsComponent {

    private fb = inject(FormBuilder);
    private service = inject(SystemSettingsService);
    private toastr = inject(ToastrService);
    private auth = inject(AuthStore);
    private destroyRef = inject(DestroyRef);

    /** El QR de Evolution caduca solo; se pide uno nuevo antes de que se apague. */
    private static readonly REFRESCO_QR_MS = 30_000;
    /** Cada cuánto se pregunta si el teléfono ya escaneó. */
    private static readonly SONDEO_ESTADO_MS = 5_000;
    /** Tope de la ventana de vinculación: pasado esto, se deja de pedir códigos. */
    private static readonly LIMITE_VINCULACION_MS = 5 * 60_000;

    readonly cargando = signal(true);
    readonly guardando = signal(false);
    readonly probando = signal(false);
    /** Sin esto se escribirían los valores vacíos del formulario encima de una configuración que sí existía. */
    readonly cargaFallida = signal(false);

    readonly estado = signal<SystemSettings | null>(null);
    readonly whatsapp = signal<EstadoWhatsApp | null>(null);
    readonly numeroPrueba = signal('');

    /** Vinculación por QR: null = recuadro cerrado. */
    readonly qr = signal<QrWhatsApp | null>(null);
    readonly pidiendoQr = signal(false);
    /** Se agotó la ventana sin que nadie escaneara. */
    readonly qrCaducado = signal(false);

    private temporizadorQr: ReturnType<typeof setInterval> | null = null;
    private temporizadorEstado: ReturnType<typeof setInterval> | null = null;
    private finVinculacion = 0;

    readonly puedeEditar = this.auth.hasPermission(Permission.SettingsUpdate);

    form = this.fb.group({
        whatsAppEnabled: [false],
        whatsAppUrl: [''],
        whatsAppToken: [''],
        whatsAppInstance: [''],
        whatsAppPhone: [''],

        mailHost: [''],
        mailPort: [465, [Validators.min(1), Validators.max(65535)]],
        mailFrom: [''],
        mailDisplayName: [''],
        mailReplyTo: ['', [Validators.email]],
        mailUser: [''],
        mailPassword: [''],
        mailUseSsl: [true],

        iaEnabled: [false],
        iaApiToken: [''],
        iaModel: ['claude-haiku-4-5'],
        iaMaxConsultasDia: [200, [Validators.min(0)]],
        iaPromptBase: [''],

        reCaptchaEnabled: [false],
        reCaptchaVersion: ['v2'],
        reCaptchaSiteKey: [''],
        reCaptchaSecretKey: [''],
        // Fuera de 0..1 la puntuacion de la v3 no significa nada: con 0 pasa todo y con mas de 1 no pasa nadie.
        reCaptchaMinScore: [0.5, [Validators.min(0), Validators.max(1)]],
    });

    constructor() {
        this.cargar();
        // Sin esto los dos temporizadores siguen latiendo —y pidiendo QR— después de salir de la pantalla.
        this.destroyRef.onDestroy(() => this.pararTemporizadores());
    }

    private cargar(): void {
        this.cargando.set(true);
        this.service.get()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: s => {
                    this.estado.set(s);
                    this.form.patchValue(s as any);
                    if (!this.puedeEditar) this.form.disable();
                    this.consultarWhatsApp();
                },
                error: () => this.cargaFallida.set(true),
            });
    }

    consultarWhatsApp(): void {
        this.service.estadoWhatsApp().subscribe({
            next: e => this.whatsapp.set(e),
            // Que no se pueda consultar el estado no invalida la pantalla: se deja sin dato en vez de teñirla de error.
            error: () => this.whatsapp.set(null),
        });
    }

    guardar(): void {
        if (this.guardando() || this.cargaFallida() || !this.puedeEditar) return;

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastr.warning('Revisa los campos marcados.', 'No se pudo guardar');
            return;
        }

        this.guardando.set(true);
        this.service.guardar(this.form.getRawValue() as any)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: s => {
                    this.estado.set(s);
                    // Se repinta con lo que devuelve el servidor: si alguien encendió WhatsApp sin instancia, se ve al momento.
                    this.form.patchValue(s as any);
                    this.toastr.success('Configuración guardada', 'Listo');
                    this.consultarWhatsApp();
                },
                error: (err: HttpErrorResponse) =>
                    this.toastr.error(typeof err.error === 'string' ? err.error : 'No se pudo guardar la configuración'),
            });
    }

    // vinculación por QR

    /** Abre el recuadro del QR y arranca el refresco y el sondeo del estado. */
    vincular(): void {
        if (this.pidiendoQr()) return;

        this.qrCaducado.set(false);
        this.finVinculacion = Date.now() + SystemSettingsComponent.LIMITE_VINCULACION_MS;

        this.pedirQr();

        this.pararTemporizadores();
        this.temporizadorQr = setInterval(() => {
            if (Date.now() >= this.finVinculacion) {
                // Se corta el refresco pero se deja el recuadro: hay que ver por qué dejó de cambiar el código.
                this.qrCaducado.set(true);
                this.pararTemporizadores();
                return;
            }
            this.pedirQr();
        }, SystemSettingsComponent.REFRESCO_QR_MS);

        this.temporizadorEstado = setInterval(() => this.comprobarVinculacion(),
            SystemSettingsComponent.SONDEO_ESTADO_MS);
    }

    /** Cierra el recuadro y deja de pedir códigos. */
    cerrarQr(): void {
        this.pararTemporizadores();
        this.qr.set(null);
        this.qrCaducado.set(false);
    }

    private pedirQr(): void {
        this.pidiendoQr.set(true);
        this.service.conectarWhatsApp()
            .pipe(finalize(() => this.pidiendoQr.set(false)))
            .subscribe({
                next: q => {
                    if (q.yaConectado) {
                        // Pasa si el teléfono volvió por su cuenta entre dos sondeos.
                        this.terminarVinculacion();
                        return;
                    }
                    this.qr.set(q);
                    if (!q.imagen && !q.codigo) {
                        this.pararTemporizadores();
                        this.toastr.warning(q.motivo ?? 'El servidor no devolvió ningún código.', 'Sin QR');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.pararTemporizadores();
                    this.qr.set(null);
                    this.toastr.error(typeof err.error === 'string' ? err.error : 'No se pudo pedir el código de vinculación');
                },
            });
    }

    private comprobarVinculacion(): void {
        this.service.estadoWhatsApp().subscribe({
            next: e => {
                this.whatsapp.set(e);
                if (e.conectado) this.terminarVinculacion();
            },
            // Un sondeo perdido no cancela la vinculación: se reintenta al siguiente.
            error: () => { },
        });
    }

    private terminarVinculacion(): void {
        this.pararTemporizadores();
        this.qr.set(null);
        this.qrCaducado.set(false);
        this.consultarWhatsApp();
        this.toastr.success('El teléfono quedó vinculado.', 'WhatsApp conectado');
    }

    private pararTemporizadores(): void {
        if (this.temporizadorQr) { clearInterval(this.temporizadorQr); this.temporizadorQr = null; }
        if (this.temporizadorEstado) { clearInterval(this.temporizadorEstado); this.temporizadorEstado = null; }
    }

    probarWhatsApp(): void {
        const numero = this.numeroPrueba().trim();
        if (!numero) {
            this.toastr.warning('Indica el número al que mandar la prueba.', 'Falta el número');
            return;
        }

        this.probando.set(true);
        this.service.probarWhatsApp(numero)
            .pipe(finalize(() => this.probando.set(false)))
            .subscribe({
                next: r => {
                    if (r.enviado) this.toastr.success(`Mensaje enviado a ${r.numero}`, 'Listo');
                    else this.toastr.warning(r.motivo ?? 'No se pudo enviar', 'No salió');
                },
                error: (err: HttpErrorResponse) =>
                    this.toastr.error(typeof err.error === 'string' ? err.error : 'No se pudo enviar la prueba'),
            });
    }
}
