import { Notifications } from 'src/app/core/models';

/** El backend no manda referencia al recurso: el destino sale de palabras clave, y el orden importa. */
const DESTINOS: ReadonlyArray<{ claves: string[]; ruta: string }> = [
    // Cumplimiento primero: su tipo lleva "alerta" y caería en la alerta de tipo de cambio.
    { claves: ['expediente ros'], ruta: '/compliance/expedientes' },
    { claves: ['alerta-cumplimiento'], ruta: '/compliance/resumen' },
    { claves: ['alerta-publicacion'], ruta: '/settings/sistema' },
    { claves: ['operacion', 'operation'], ruta: '/operations' },
    { claves: ['chat', 'mensaje', 'message'], ruta: '/chats' },
    { claves: ['soporte', 'support', 'ticket'], ruta: '/support' },
    { claves: ['cupon', 'coupon'], ruta: '/coupons' },
    { claves: ['tipo de cambio', 'alerta', 'alert', 'exchange'], ruta: '/account/exchange-alert' },
];

const RUTA_POR_DEFECTO = '/notifications';
const OPERACION_EN_TEXTO = /\b(?:GM|SC|AC)-(\d+)\b/i;

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function operationIdDeNotificacion(notification: Notifications): number | null {
    if (notification.operationId) return notification.operationId;

    const match = `${notification.type ?? ''} ${notification.message ?? ''}`.match(OPERACION_EN_TEXTO);
    const id = Number(match?.[1]);

    return Number.isFinite(id) && id > 0 ? id : null;
}

export function rutaDeNotificacion(notification: Notifications, atiendeOperaciones = false): string {
    const texto = normalizar(`${notification.type ?? ''} ${notification.message ?? ''}`);

    for (const destino of DESTINOS) {
        if (destino.claves.some(clave => texto.includes(clave))) {
            return destino.ruta;
        }
    }

    return RUTA_POR_DEFECTO;
}
