export interface BlackList {
    id: number;
    documentTypeId: number;
    documentTypeName?: string;
    documentNumber: string;
    email: string;
    reason?: string;
    createdAt?: string;
    /** La coincidencia con listas restrictivas que la originó; null si se agregó a mano. */
    screeningHitId?: number | null;
}

export interface BlackListReporte {
    documentTypeName: string | null;
    documentNumber: string | null;
    email: string | null;
    reason: string | null;
    createdAt: string;
}
