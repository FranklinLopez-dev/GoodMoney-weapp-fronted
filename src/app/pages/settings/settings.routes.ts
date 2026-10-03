import { ResolveFn, Routes } from '@angular/router';
import { CompanyComponent } from './company/company.component';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { CompanyResolver } from './company/company.resolver';
import { FacturacionConfigComponent } from '../fiscal/configuracion/facturacion-config.component';
import { DocumentTypeResolver } from './documents/documents.resolver';
import { DocumentTypesComponent } from './documents/document-type.component';
import { BanksResolver } from './banks/banks.resolver';
import { BanksComponent } from './banks/banks.component';
import { ActivitiesResolver } from './activities/activities.resolver';
import { ActivitiesComponent } from './activities/activities.component';
import { PositionsResolver } from './positions/positions.resolver';
import { PositionsComponent } from './positions/positions.component';
import { CompanyBanksResolver } from './company-banks/company-banks.resolver';
import { CompanyBanksComponent } from './company-banks/company-banks.component';
import { ExchangeRateResolver } from './exchange-rates/exchange-rate.resolver';
import { ExchangeRateComponent } from './exchange-rates/exchange-rate.component';
import { PaymentConditionsResolver } from './payment-conditions/payment-conditions.resolver';
import { PaymentConditionsComponent } from './payment-conditions/payment-conditions.component';
import { CouponsResolver } from './coupons/coupons.resolver';
import { CouponsComponent } from './coupons/coupons.component';
import { inject } from '@angular/core';
import { ExchangeRateService } from './exchange-rates/exchange-rate.service';
import { EmailsComponent } from './emails/emails.component';
import { EmailsResolver } from './emails/emails.resolver';
import { AsistenteFaqsComponent } from './asistente/asistente-faqs.component';
import { AsistenteFaqsResolver } from './asistente/asistente-faqs.resolver';
import { SeasonalLogosComponent } from './seasonal-logos/seasonal-logos.component';
import { SeasonalLogosResolver } from './seasonal-logos/seasonal-logos.resolver';
import { BusinessHoursComponent } from './business-hours/business-hours.component';
import { HolidaysComponent } from './holidays/holidays.component';
import { SettingsHubComponent } from './hub/settings-hub.component';
import { OperationRulesComponent } from './operation-rules/operation-rules.component';
import { CompanySectionComponent } from './company/sections/company-section.component';
import { SystemSettingsComponent } from './system/system-settings.component';

export const exchangeRateResolver: ResolveFn<any> = () => {
  return inject(ExchangeRateService).getOne();
};

export const SettingsRoutes: Routes = [
    {
        // Permiso propio y no bussiness.*: aqui viven claves de API y la contrasena del correo.
        path: 'sistema',
        component: SystemSettingsComponent,
        data: {
            title: 'Integraciones del sistema',
            permission: Permission.SettingsIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Integraciones del sistema' },
            ],
        }
    },
    // Portada: antes /settings saltaba directo a "Empresa" y había que conocer el menú de memoria.
    {
        path: '',
        pathMatch: 'full',
        component: SettingsHubComponent,
        data: {
            title: 'Configuración',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración' },
            ],
        }
    },
    {
        path: 'company',
        component: CompanyComponent,
        data: {
            title: 'Empresa',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Empresa' },
            ],
        },
        resolve: {
            preload: CompanyResolver
        }
    },
    {
        path: 'emails',
        component: EmailsComponent,
        data: {
            title: 'Correos electrónicos',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Correos electrónicos' },
            ],
        },
        resolve: {
            preload: EmailsResolver
        }
    },
    // Comparten componente porque todas guardan la misma ficha; cambia lo que muestran.
    {
        // Facturación electrónica nativa: certificado, usuario SOL, prueba en beta y series.
        path: 'facturacion',
        component: FacturacionConfigComponent,
        data: {
            title: 'Facturación electrónica',
            permission: Permission.BillingIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Facturación electrónica' },
            ],
        },
        // `preload` trae la ficha general, que usa la pestaña de series.
        resolve: { preload: CompanyResolver }
    },
    {
        path: 'apps',
        component: CompanySectionComponent,
        data: {
            section: 'apps',
            title: 'Aplicaciones y publicidad',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Aplicaciones y publicidad' },
            ],
        },
        resolve: { preload: CompanyResolver }
    },
    {
        path: 'correos-marca',
        component: CompanySectionComponent,
        data: {
            section: 'correos',
            title: 'Apariencia de los correos',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Apariencia de los correos' },
            ],
        },
        resolve: { preload: CompanyResolver }
    },
    {
        path: 'reglas',
        component: OperationRulesComponent,
        data: {
            title: 'Reglas de operación',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Reglas de operación' },
            ],
        }
    },
    {
        path: 'horario',
        component: BusinessHoursComponent,
        data: {
            title: 'Horario de atención',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Horario de atención' },
            ],
        }
    },
    {
        path: 'feriados',
        component: HolidaysComponent,
        data: {
            title: 'Feriados',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Feriados' },
            ],
        }
    },
    {
        path: 'asistente',
        component: AsistenteFaqsComponent,
        data: {
            title: 'Asistente virtual',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Asistente virtual' },
            ],
        },
        resolve: {
            preload: AsistenteFaqsResolver
        }
    },
    {
        path: 'logos-temporada',
        component: SeasonalLogosComponent,
        data: {
            title: 'Logos de temporada',
            permission: Permission.BusinessIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Logos de temporada' },
            ],
        },
        resolve: {
            preload: SeasonalLogosResolver
        }
    },
    {
        path: 'document-types',
        component: DocumentTypesComponent,
        data: {
            title: 'Documentos de Identidad',
            permission: Permission.DocumentTypeIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Documentos de Identidad' },
            ],
        },
        resolve: {
            preload: DocumentTypeResolver
        }
    },
    {
        path: 'banks',
        component: BanksComponent,
        data: {
            title: 'Entidades Bancarias',
            permission: Permission.BankIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Entidades Bancarias' },
            ],
        },
        resolve: {
            preload: BanksResolver
        }
    },
    {
        path: 'activities',
        component: ActivitiesComponent,
        data: {
            title: 'Actividades Económicas',
            permission: Permission.ActivitiesIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Actividades Económicas' },
            ],
        },
        resolve: {
            preload: ActivitiesResolver
        }
    },
    {
        path: 'positions',
        component: PositionsComponent,
        data: {
            title: 'Ocupaciones y/o profesiones',
            permission: Permission.PositionsIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Ocupaciones y/o profesiones' },
            ],
        },
        resolve: {
            preload: PositionsResolver
        }
    },
    {
        path: 'company-banks',
        component: CompanyBanksComponent,
        data: {
            title: 'Cuentas de la Empresa',
            permission: Permission.CompanyBanksIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Cuentas de la Empresa' },
            ],
        },
        resolve: {
            preload: CompanyBanksResolver
        }
    },
    {
        path: 'exchange-rates',
        component: ExchangeRateComponent,
        data: {
            title: 'Tipo de cambio',
            permission: Permission.ExchangeRatesIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Tipo de cambio' },
            ],
        },
        resolve: {
            preload: ExchangeRateResolver,
            exchange: exchangeRateResolver
        }
    },
    {
        path: 'coupons',
        component: CouponsComponent,
        data: {
            title: 'Cupones',
            permission: Permission.CouponsIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Cupones' },
            ],
        },
        resolve: {
            preload: CouponsResolver
        }
    },
    {
        path: 'payment-conditions',
        component: PaymentConditionsComponent,
        data: {
            title: 'Métodos de pago',
            permission: Permission.PaymentConditionIndex,
            urls: [
                { title: 'Configuración', url: '/settings' },
                { title: 'Métodos de pago' },
            ],
        },
        resolve: {
            preload: PaymentConditionsResolver
        }
    }
];
