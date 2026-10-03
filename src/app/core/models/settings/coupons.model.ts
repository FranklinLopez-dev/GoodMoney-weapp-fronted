export interface Coupons {
    id: number;
    code: string;
    description: string;
    isUsers: boolean;
    dateStart: string;
    dameEnd: string;
    numOperations: number;
    isActive: boolean;
    couponUsers: CouponsUser[];
    discount: number;
    numOperationsGlobal: number;
    importUsers: boolean;
    isCompra: boolean;
    isVenta: boolean;
    usedCount: number;
    remainingCount: number;
    pendingCount: number;
    usedGlobalCount: number;
    statusText: string;
    isCopiar: boolean;
}

export interface CouponsUser {
    applicationUserId?: string;
    applicationUserEmail: string;
    applicationUser?: any;
}
