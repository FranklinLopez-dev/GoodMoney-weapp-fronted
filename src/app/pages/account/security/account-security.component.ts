import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthService } from 'src/app/core/auth/auth.service';
import { UtilsService } from 'src/app/core/services/common/utils.service';

/** Los tres momentos de la pantalla. */
type Paso = 'estado' | 'clave' | 'codigo' | 'apagar';

/** Encenderla va en dos tiempos: si el correo no llega con la protección ya activa, el usuario se queda fuera. */
@Component({
    selector: 'app-account-security',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, TablerIconsModule],
    templateUrl: './account-security.component.html',
    styleUrls: ['./account-security.component.scss'],
})
export class AccountSecurityComponent {

    private auth = inject(AuthService);
    private appData = inject(UtilsService);
    private toastr = inject(ToastrService);

    readonly cargando = signal(true);
    readonly trabajando = signal(false);
    readonly activa = signal(false);
    readonly paso = signal<Paso>('estado');

    readonly clave = signal('');
    readonly codigo = signal('');
    readonly error = signal<string | null>(null);

    /** El correo al que va el código; es el dato que el usuario necesita ver. */
    readonly correo = computed(() => this.appData.profile()?.email ?? '');

    constructor() {
        this.auth.getTwoFactor()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: res => this.activa.set(!!res?.enabled),
                error: () => this.toastr.error('No se pudo consultar el estado de la verificación en dos pasos'),
            });
    }

    // encender

    empezarActivacion(): void {
        this.limpiar();
        this.paso.set('clave');
    }

    /** Paso 1: contraseña. Si es correcta, el API manda el código. */
    pedirCodigo(): void {
        if (!this.clave() || this.trabajando()) return;

        this.trabajando.set(true);
        this.error.set(null);

        this.auth.sendTwoFactorCode(this.clave())
            .pipe(finalize(() => this.trabajando.set(false)))
            .subscribe({
                next: () => {
                    this.paso.set('codigo');
                    this.toastr.success(`Te enviamos un código a ${this.correo()}`, 'Revisa tu correo');
                },
                error: err => this.error.set(this.mensaje(err, 'No pudimos enviar el código.')),
            });
    }

    /** Paso 2: el código del correo. Recién aquí queda activa. */
    confirmarActivacion(): void {
        const code = this.codigo().replace(/\D/g, '').slice(0, 6);
        if (code.length < 6 || this.trabajando()) return;

        this.trabajando.set(true);
        this.error.set(null);

        this.auth.setTwoFactor(true, this.clave(), code)
            .pipe(finalize(() => this.trabajando.set(false)))
            .subscribe({
                next: res => {
                    this.activa.set(!!res?.enabled);
                    this.limpiar();
                    this.paso.set('estado');
                    this.toastr.success('A partir de ahora te pediremos un código al entrar', 'Verificación activada');
                },
                error: err => this.error.set(this.mensaje(err, 'El código no es válido.')),
            });
    }

    /** Vuelve a mandar el código sin salir del paso. */
    reenviarCodigo(): void {
        if (this.trabajando()) return;

        this.trabajando.set(true);
        this.error.set(null);

        this.auth.sendTwoFactorCode(this.clave())
            .pipe(finalize(() => this.trabajando.set(false)))
            .subscribe({
                next: () => this.toastr.success('Código reenviado', 'Revisa tu correo'),
                error: err => this.error.set(this.mensaje(err, 'No pudimos reenviar el código.')),
            });
    }

    // apagar

    empezarDesactivacion(): void {
        this.limpiar();
        this.paso.set('apagar');
    }

    confirmarDesactivacion(): void {
        if (!this.clave() || this.trabajando()) return;

        this.trabajando.set(true);
        this.error.set(null);

        this.auth.setTwoFactor(false, this.clave())
            .pipe(finalize(() => this.trabajando.set(false)))
            .subscribe({
                next: res => {
                    this.activa.set(!!res?.enabled);
                    this.limpiar();
                    this.paso.set('estado');
                    this.toastr.info('Ya no te pediremos código al entrar', 'Verificación desactivada');
                },
                error: err => this.error.set(this.mensaje(err, 'No se pudo desactivar.')),
            });
    }

    // comunes

    cancelar(): void {
        this.limpiar();
        this.paso.set('estado');
    }

    private limpiar(): void {
        this.clave.set('');
        this.codigo.set('');
        this.error.set(null);
    }

    /** El API devuelve el motivo como texto plano; conviene enseñarlo tal cual. */
    private mensaje(err: any, porDefecto: string): string {
        if (typeof err?.error === 'string' && err.error.trim()) return err.error;
        if (err?.status === 429) return 'Demasiados intentos. Espera unos minutos.';
        return porDefecto;
    }
}
