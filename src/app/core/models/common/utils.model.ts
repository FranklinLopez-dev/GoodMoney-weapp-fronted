import { Profile, Company, ExchangeRate, Notifications, Chats } from "../index";

export interface DataInitialResponse {
    profile: Profile;
    company: Company;
    numOperationsByValidate: number;
    numOneOperationsByValidate: number;
    numProfilesByValidate: number;
    notifications: Notifications[];
    numNotificationsUnread: number;
    conversations: Chats[];
    numChatsUnread: number;
}

export interface Dashboard {
    exchangeRate: ExchangeRate;
    listExchageRates: ExchangeRate[];
    totalCompras: GroupedData[];
    totalVenta: GroupedData[];
    totalUsers: GroupedData[];
    totalOperaciones: GroupOperations;
    rankigUsers: GroupedRanking[];
    isAdmin: boolean;
}

export interface GroupOperations {
    compras: GroupedData[];
    ventas: GroupedData[];
}

export interface GroupedData {
    date: string;
    amount: number;
    operaciones?: number;
}

export interface GroupedRanking {
    applicationUser: Profile;
    amount: number;
    operaciones?: number;
}

export interface Sunat {
    compra: number;
    venta: number;
}