import { Permission } from 'src/app/core/auth/permissions.enum';
import { NavItem } from './nav-item/nav-item';

/** El rótulo hereda los permisos de lo que encabeza, así que un cliente no ve ninguno de los dos bloques. */

/** Lo del usuario: sin permisos, lo ve todo el mundo que entra. */
const MI_CUENTA: NavItem[] = [
  {
    displayName: 'Cambiar dólares',
    iconName: 'solar:refresh-circle-line-duotone',
    route: '/operations/create',
  },
  {
    displayName: 'Mis operaciones',
    iconName: 'solar:clipboard-list-line-duotone',
    route: '/operations',
  },
  {
    displayName: 'Mis cuentas bancarias',
    iconName: 'solar:card-2-line-duotone',
    route: '/banks-accounts',
  },
  {
    displayName: 'Mis beneficios',
    iconName: 'solar:ticket-sale-line-duotone',
    route: '/coupons',
  },
  {
    displayName: 'Mis perfiles',
    iconName: 'solar:user-circle-line-duotone',
    route: '/profiles',
  },
  {
    displayName: 'Mis avisos',
    iconName: 'solar:bell-line-duotone',
    route: '/account/notifications',
  },
  {
    displayName: 'Alerta de tipo de cambio',
    iconName: 'solar:money-bag-line-duotone',
    route: '/account/exchange-alert',
  },
  {
    displayName: 'Seguridad de mi cuenta',
    iconName: 'solar:lock-password-line-duotone',
    route: '/account/security',
  },
];

/** El backoffice: de lo diario a lo que se configura una vez. */
const ADMINISTRACION: NavItem[] = [
  {
    displayName: 'Operaciones',
    iconName: 'solar:refresh-circle-line-duotone',
    // Apuntaba a 'security': un grupo con hijos no navega, pero marcaba el menú activo donde no tocaba.
    route: 'operations',
    children: [
      {
        displayName: 'Web',
        subItemIcon: true,
        iconName: 'solar:monitor-smartphone-line-duotone',
        route: 'operations/web',
        permission: Permission.WebsIndex
      },
      {
        displayName: 'Novodivisas',
        subItemIcon: true,
        iconName: 'solar:calculator-line-duotone',
        route: 'operations/novodivisas',
        permission: Permission.WebsIndex
      }
    ]
  },
  {
    displayName: 'Reportes',
    iconName: 'solar:chart-2-line-duotone',
    route: 'reports',
    children: [
      {
        displayName: 'Embudo',
        subItemIcon: true,
        iconName: 'solar:filter-line-duotone',
        route: 'reports/embudo',
        permission: Permission.WebsIndex
      },
      {
        displayName: 'Trazabilidad',
        subItemIcon: true,
        iconName: 'solar:route-line-duotone',
        route: 'reports/traceability',
        permission: Permission.WebsIndex
      },
      {
        displayName: 'Clientes',
        subItemIcon: true,
        iconName: 'solar:users-group-rounded-line-duotone',
        route: 'reports/clients',
        permission: Permission.UserIndex
      },
      {
        displayName: 'Alertas de clientes',
        subItemIcon: true,
        iconName: 'solar:bell-bing-line-duotone',
        route: 'reports/alertas',
        permission: Permission.AlertsReport
      },
      {
        displayName: 'Contabilidad',
        subItemIcon: true,
        iconName: 'solar:calculator-line-duotone',
        route: 'reports/contability',
        permission: Permission.WebsIndex
      },
      {
        displayName: 'SBS',
        subItemIcon: true,
        iconName: 'solar:shield-check-line-duotone',
        route: 'reports/sbs',
        permission: Permission.WebsIndex
      },
      {
        displayName: 'Libro de reclamaciones',
        subItemIcon: true,
        iconName: 'solar:clipboard-text-line-duotone',
        route: 'reports/book-claims',
        permission: Permission.BookclaimsIndex
      }
    ]
  },
  {
    displayName: 'Seguridad',
    iconName: 'solar:shield-check-line-duotone',
    route: 'security',
    children: [
      {
        displayName: 'Usuarios',
        subItemIcon: true,
        iconName: 'solar:users-group-rounded-line-duotone',
        route: 'security/users',
        permission: Permission.UserIndex
      },
      {
        displayName: 'Roles',
        subItemIcon: true,
        iconName: 'solar:shield-user-line-duotone',
        route: 'security/roles',
        permission: Permission.RolesIndex
      },
      {
        displayName: 'Asignar perfiles',
        subItemIcon: true,
        iconName: 'solar:clipboard-text-line-duotone',
        route: 'security/assign-profiles',
        permission: Permission.UserIndex
      },
      {
        displayName: 'Lista negra',
        subItemIcon: true,
        iconName: 'solar:danger-circle-line-duotone',
        route: 'security/black-list',
        permission: Permission.UserIndex
      },
      {
        displayName: 'Auditoría',
        subItemIcon: true,
        iconName: 'solar:clipboard-check-line-duotone',
        route: 'security/auditoriums',
        permission: Permission.AuditoriumsIndex
      }
    ]
  },
  {
    displayName: 'Personas',
    iconName: 'solar:user-id-line-duotone',
    route: 'persons',
    permission: Permission.PersonsIndex,
  },
  {
    displayName: 'Gestión fiscal',
    iconName: 'solar:bill-list-line-duotone',
    route: 'fiscal',
    permission: Permission.FiscalIndex,
  },
  {
    displayName: 'Cumplimiento',
    iconName: 'solar:shield-warning-line-duotone',
    route: 'compliance',
    permission: Permission.ComplianceIndex,
  },
  {
    displayName: 'Soporte',
    iconName: 'solar:headphones-round-sound-line-duotone',
    route: 'support',
    permission: Permission.SupportIndex,
  },
  {
    displayName: 'Configuración',
    iconName: 'solar:settings-line-duotone',
    route: 'settings',
    children: [
      // Primero la portada: desde ahí se llega a todo, agrupado y explicado.
      {
        displayName: 'Todos los ajustes',
        subItemIcon: true,
        iconName: 'solar:widget-4-line-duotone',
        route: 'settings',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Empresa',
        subItemIcon: true,
        iconName: 'solar:buildings-2-line-duotone',
        route: 'settings/company',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Reglas de operación',
        subItemIcon: true,
        iconName: 'solar:tuning-2-line-duotone',
        route: 'settings/reglas',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Tipo de cambio',
        subItemIcon: true,
        iconName: 'solar:money-bag-line-duotone',
        route: 'settings/exchange-rates',
        permission: Permission.ExchangeRatesIndex
      },
      {
        displayName: 'Cuentas de la empresa',
        subItemIcon: true,
        iconName: 'solar:card-line-duotone',
        route: 'settings/company-banks',
        permission: Permission.CompanyBanksIndex
      },
      {
        displayName: 'Cupones',
        subItemIcon: true,
        iconName: 'solar:ticket-sale-line-duotone',
        route: 'settings/coupons',
        permission: Permission.CouponsIndex
      },
      {
        displayName: 'Correos electrónicos',
        subItemIcon: true,
        iconName: 'solar:letter-line-duotone',
        route: 'settings/emails',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Horario de atención',
        subItemIcon: true,
        iconName: 'solar:clock-circle-line-duotone',
        route: 'settings/horario',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Feriados',
        subItemIcon: true,
        iconName: 'solar:calendar-mark-line-duotone',
        route: 'settings/feriados',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Asistente virtual',
        subItemIcon: true,
        iconName: 'solar:chat-round-line-duotone',
        route: 'settings/asistente',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Logos de temporada',
        subItemIcon: true,
        iconName: 'solar:gallery-wide-line-duotone',
        route: 'settings/logos-temporada',
        permission: Permission.BusinessIndex
      },
      {
        displayName: 'Entidades bancarias',
        subItemIcon: true,
        iconName: 'solar:buildings-line-duotone',
        route: 'settings/banks',
        permission: Permission.BankIndex
      },
      {
        displayName: 'Documentos de identidad',
        subItemIcon: true,
        iconName: 'solar:user-id-line-duotone',
        route: 'settings/document-types',
        permission: Permission.DocumentTypeIndex
      },
      {
        displayName: 'Actividades económicas',
        subItemIcon: true,
        iconName: 'solar:case-round-line-duotone',
        route: 'settings/activities',
        permission: Permission.ActivitiesIndex
      },
      {
        displayName: 'Ocupaciones y profesiones',
        subItemIcon: true,
        iconName: 'solar:users-group-two-rounded-line-duotone',
        route: 'settings/positions',
        permission: Permission.PositionsIndex
      },
      {
        displayName: 'Métodos de pago',
        subItemIcon: true,
        iconName: 'solar:card-transfer-line-duotone',
        route: 'settings/payment-conditions',
        permission: Permission.PaymentConditionIndex
      }
    ],
  },
];

/** Los permisos de todo el bloque, para que el rótulo aparezca y desaparezca con él. */
const PERMISOS_ADMIN = ADMINISTRACION
  .flatMap(grupo => grupo.children ?? [])
  .map(hijo => hijo.permission)
  .filter((p): p is string => !!p);

export const navItems: NavItem[] = [
  {
    displayName: 'Inicio',
    iconName: 'solar:widget-add-line-duotone',
    route: '/home',
  },

  { navCap: 'Mi cuenta', divider: true },
  ...MI_CUENTA,

  { navCap: 'Administración', divider: true, permissionsAny: PERMISOS_ADMIN },
  ...ADMINISTRACION,
];
