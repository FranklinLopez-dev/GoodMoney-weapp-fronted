/** El API representa el estado como '1'/'0'; los formularios como boolean. */
export function esEstadoActivo(estado: string | null | undefined): boolean {
    return estado == '1';
}

export function aEstadoApi(activo: boolean): string {
    return activo ? '1' : '0';
}
