import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';

interface Ajuste {
    titulo: string;
    descripcion: string;
    icono: string;
    ruta: string;
    permiso: Permission;
}

interface Grupo {
    titulo: string;
    descripcion: string;
    ajustes: Ajuste[];
}

/** Trece entradas agrupadas por lo que hacen; cada tarjeta se muestra solo si el rol tiene su permiso. */
@Component({
    selector: 'app-settings-hub',
    standalone: true,
    imports: [CommonModule, RouterModule, TablerIconsModule],
    templateUrl: './settings-hub.component.html',
    styleUrls: ['./settings-hub.component.scss'],
})
export class SettingsHubComponent {

    private auth = inject(AuthStore);

    private readonly GRUPOS: Grupo[] = [
        {
            titulo: 'El negocio',
            descripcion: 'Quién eres y cómo te ve el cliente.',
            ajustes: [
                {
                    titulo: 'Datos de la empresa',
                    descripcion: 'Razón social, RUC, dirección y contacto.',
                    icono: 'building-bank', ruta: '/settings/company',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Integraciones del sistema',
                    descripcion: 'WhatsApp, correo saliente e inteligencia artificial.',
                    icono: 'plug-connected', ruta: '/settings/sistema',
                    permiso: Permission.SettingsIndex,
                },
                {
                    titulo: 'Facturación electrónica',
                    descripcion: 'Credenciales SUNAT y series de comprobantes.',
                    icono: 'receipt', ruta: '/settings/facturacion',
                    permiso: Permission.BillingIndex,
                },
                {
                    titulo: 'Aplicaciones y publicidad',
                    descripcion: 'Enlaces a las tiendas y aviso al visitante.',
                    icono: 'device-mobile', ruta: '/settings/apps',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Horario de atención',
                    descripcion: 'Se muestra en el panel y en el sitio público.',
                    icono: 'clock-hour-9', ruta: '/settings/horario',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Feriados',
                    descripcion: 'Días sin atención. Mandan sobre el horario.',
                    icono: 'calendar-off', ruta: '/settings/feriados',
                    permiso: Permission.BusinessIndex,
                },
            ],
        },
        {
            titulo: 'Operación y dinero',
            descripcion: 'Las reglas con las que se cotiza y se cobra.',
            ajustes: [
                {
                    titulo: 'Reglas de operación',
                    descripcion: 'Vigencia del tipo de cambio, montos y disponibilidad.',
                    icono: 'adjustments', ruta: '/settings/reglas',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Tipo de cambio',
                    descripcion: 'Precio de compra y de venta del día.',
                    icono: 'arrows-exchange', ruta: '/settings/exchange-rates',
                    permiso: Permission.ExchangeRatesIndex,
                },
                {
                    titulo: 'Cuentas de la empresa',
                    descripcion: 'Dónde recibe el dinero Good Money.',
                    icono: 'wallet', ruta: '/settings/company-banks',
                    permiso: Permission.CompanyBanksIndex,
                },
                {
                    titulo: 'Cupones',
                    descripcion: 'Descuentos sobre el tipo de cambio.',
                    icono: 'ticket', ruta: '/settings/coupons',
                    permiso: Permission.CouponsIndex,
                },
                {
                    titulo: 'Métodos de pago',
                    descripcion: 'Formas de pago aceptadas.',
                    icono: 'credit-card', ruta: '/settings/payment-conditions',
                    permiso: Permission.PaymentConditionIndex,
                },
            ],
        },
        {
            titulo: 'Comunicación con el cliente',
            descripcion: 'Lo que el cliente recibe y lee.',
            ajustes: [
                {
                    titulo: 'Correos electrónicos',
                    descripcion: 'Plantillas de los correos automáticos.',
                    icono: 'mail', ruta: '/settings/emails',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Apariencia de los correos',
                    descripcion: 'Colores, logo y pie de los correos.',
                    icono: 'palette', ruta: '/settings/correos-marca',
                    permiso: Permission.BusinessIndex,
                },
                {
                    titulo: 'Asistente virtual',
                    descripcion: 'Preguntas y respuestas del chat de ayuda.',
                    icono: 'message-chatbot', ruta: '/settings/asistente',
                    permiso: Permission.BusinessIndex,
                },
            ],
        },
        {
            titulo: 'Catálogos',
            descripcion: 'Listas que alimentan los formularios. Se tocan poco.',
            ajustes: [
                {
                    titulo: 'Entidades bancarias',
                    descripcion: 'Bancos disponibles para las cuentas.',
                    icono: 'building-bank', ruta: '/settings/banks',
                    permiso: Permission.BankIndex,
                },
                {
                    titulo: 'Documentos de identidad',
                    descripcion: 'DNI, RUC, pasaporte, carné de extranjería.',
                    icono: 'id', ruta: '/settings/document-types',
                    permiso: Permission.DocumentTypeIndex,
                },
                {
                    titulo: 'Actividades económicas',
                    descripcion: 'Giro del negocio de los perfiles jurídicos.',
                    icono: 'briefcase', ruta: '/settings/activities',
                    permiso: Permission.ActivitiesIndex,
                },
                {
                    titulo: 'Ocupaciones y profesiones',
                    descripcion: 'Ocupación declarada por el cliente.',
                    icono: 'user-search', ruta: '/settings/positions',
                    permiso: Permission.PositionsIndex,
                },
            ],
        },
    ];

    /** Solo lo que el rol puede abrir; los grupos que quedan vacíos no se pintan. */
    readonly grupos = computed(() =>
        this.GRUPOS
            .map(g => ({ ...g, ajustes: g.ajustes.filter(a => this.auth.hasPermission(a.permiso)) }))
            .filter(g => g.ajustes.length > 0)
    );
}
