export interface Roles {
    id: string;
    name: string;
    normalizedName: string;
    concurrencyStamp: string;
    isDefault: boolean;
}

export interface RolePermission {
    nameClaim: string;
    type: string
}