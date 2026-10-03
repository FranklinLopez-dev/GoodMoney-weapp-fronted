import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { CompanySeriesComponent } from '../../settings/company/components/company-tabs/tabs/company-series/company-series.component';
import { CompanyBillingService } from '../../settings/company/company-billing.service';
import { CertificadoFiscal, ConfigFiscal, FiscalService } from '../fiscal.service';
import { mostrarErrorFiscal } from '../fiscal-comunes';

/**
 * Configuración → Facturación electrónica. Reemplaza a la pantalla del PSE (usuario/clave SOL en
 * claro, URL y token del facturador): ahora el certificado y la clave SOL se guardan cifrados, se
 * verifican al cargarlos y pasar a Producción exige tenerlo todo en regla.
 */
@Component({
    selector: 'app-facturacion-config',
    standalone: true,
    imports: [CommonModule, MaterialModule, FormsModule, CompanySeriesComponent],
    templateUrl: './facturacion-config.component.html',
    styleUrls: ['../../compliance/_compartido.scss', '../_fiscal.scss'],
})
export class FacturacionConfigComponent {
    private service = inject(FiscalService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    private empresa = inject(CompanyBillingService);
    readonly puedeEditar = inject(AuthStore).hasPermission(Permission.BillingUpdate);

    readonly config = signal<ConfigFiscal | null>(null);
    readonly certificados = signal<CertificadoFiscal[]>([]);

    readonly ubigeo = signal('');
    readonly establecimiento = signal('');
    readonly modoBoletas = signal(0);
    readonly guardando = signal(false);

    readonly archivo = signal<File | null>(null);
    readonly passwordPfx = signal('');
    readonly alias = signal('');
    readonly subiendo = signal(false);

    readonly solUsuario = signal('');
    readonly solClave = signal('');
    readonly verificandoSol = signal(false);

    readonly probando = signal(false);

    readonly sire = signal<Record<string, string>>({});
    readonly guardandoCredenciales = signal(false);

    constructor() { this.cargar(); }

    cargar(): void {
        this.service.config().subscribe({
            next: c => {
                this.config.set(c);
                this.ubigeo.set(c.ubigeo ?? '');
                this.establecimiento.set(c.codigoEstablecimiento ?? '0000');
                this.modoBoletas.set(c.modoBoletas);
                this.solUsuario.set(c.solUsuario ?? '');
            },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo cargar la configuración.'),
        });
        this.service.certificados().subscribe({ next: c => this.certificados.set(c ?? []), error: () => {} });
    }

    private guardarConAmbiente(ambiente: number, mensaje: string): void {
        this.guardando.set(true);
        this.service.guardarConfig({ ambiente, modoBoletas: this.modoBoletas(), ubigeo: this.ubigeo().trim() || null })
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: c => { this.config.set(c); this.toastr.success(mensaje); },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo guardar.'),
            });
    }

    guardar(): void {
        const codigo = this.establecimiento().trim();
        if (!/^\d{4}$/.test(codigo)) {
            this.toastr.info('El código de establecimiento son 4 dígitos (0000 es el domicilio fiscal).');
            return;
        }
        // El código de establecimiento vive en la empresa (endpoint propio); el resto, en la configuración fiscal.
        if (codigo !== this.config()?.codigoEstablecimiento) {
            this.empresa.update({ codeSunat: codigo }).subscribe({
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo guardar el código de establecimiento.'),
            });
        }
        this.guardarConAmbiente(this.config()?.ambiente ?? 0, 'Configuración guardada.');
    }

    pasarAProduccion(): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Emitir en producción',
                message: 'Desde ahora los comprobantes tendrán valor tributario ante SUNAT, y las operaciones que quedaron ' +
                         'por facturar se emitirán en los próximos minutos. ¿Continuar?',
                confirmText: 'Pasar a producción',
                color: 'warn',
            },
        }).afterClosed().subscribe(ok => { if (ok) this.guardarConAmbiente(1, 'La facturación electrónica ya emite en producción.'); });
    }

    volverABeta(): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Volver a pruebas',
                message: 'Mientras esté en beta, las operaciones que se confirmen en el servidor de producción quedarán ' +
                         'SIN comprobante hasta volver a producción. ¿Continuar?',
                confirmText: 'Volver a beta',
                color: 'warn',
            },
        }).afterClosed().subscribe(ok => { if (ok) this.guardarConAmbiente(0, 'La facturación volvió al ambiente de pruebas.'); });
    }

    alElegirPfx(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        this.archivo.set(input.files?.[0] ?? null);
    }

    subirCertificado(): void {
        const archivo = this.archivo();
        if (!archivo) { this.toastr.info('Elige el archivo .pfx del certificado.'); return; }
        this.subiendo.set(true);
        this.service.subirCertificado(archivo, this.passwordPfx(), this.alias())
            .pipe(finalize(() => this.subiendo.set(false)))
            .subscribe({
                next: c => {
                    this.toastr.success(`Certificado cargado: vence el ${new Date(c.venceEl).toLocaleDateString('es-PE')}.`);
                    this.archivo.set(null);
                    this.passwordPfx.set('');
                    this.alias.set('');
                    this.cargar();
                },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo cargar el certificado.'),
            });
    }

    guardarSol(): void {
        if (!this.solUsuario().trim() || !this.solClave()) { this.toastr.info('Completa el usuario y la clave SOL.'); return; }
        this.verificandoSol.set(true);
        this.service.guardarSol(this.solUsuario().trim(), this.solClave())
            .pipe(finalize(() => this.verificandoSol.set(false)))
            .subscribe({
                next: r => { this.toastr.success(r.mensaje); this.solClave.set(''); this.cargar(); },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo verificar el usuario SOL.'),
            });
    }

    probarBeta(): void {
        this.probando.set(true);
        this.service.probarBeta().pipe(finalize(() => this.probando.set(false))).subscribe({
            next: r => { this.toastr.success(r.mensaje); this.cargar(); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'La prueba en beta no pasó.'),
        });
    }

    valorSire(clave: string): string { return this.sire()[clave] ?? ''; }
    cambiarSire(clave: string, valor: string): void { this.sire.set({ ...this.sire(), [clave]: valor }); }

    guardarCredenciales(): void {
        this.guardandoCredenciales.set(true);
        this.service.guardarCredenciales(this.sire()).pipe(finalize(() => this.guardandoCredenciales.set(false))).subscribe({
            next: r => { this.toastr.success(r.mensaje); this.sire.set({}); },
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudieron guardar las credenciales.'),
        });
    }
}
