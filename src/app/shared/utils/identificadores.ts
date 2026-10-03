/**
 * Un UUID v4. `crypto.randomUUID()` solo existe en contexto seguro (https o localhost) y en navegadores
 * recientes: servido por http en una IP de la red, o en un Safari viejo, lanza. `getRandomValues` sí está.
 */
export function nuevoUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try { return crypto.randomUUID(); } catch { /* sigue abajo */ }
    }
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
