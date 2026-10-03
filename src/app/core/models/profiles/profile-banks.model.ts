import { Activities } from "../settings/activities.model";
import { Banks } from "../settings/banks.model";
import { CompanyBanks } from "../settings/company-banks.model";
import { DocumentType } from "../settings/document-type.model";
import { Positions } from "../settings/positions.model";

export interface ProfileBanks {
    id: number,
    eProfileId: number,
    bankId: number,
    bankName: string;
    bankIcon: any;
    isTercero: boolean,
    isMe: boolean,
    isPerson: boolean,
    isCheck: boolean,
    documentTypeId: number,
    documentNumber: string,
    name: string,
    lastName: string,
    email: string,
    positionId: number,
    activityId: number,
    typeAccount: string,
    coinId: string,
    accountNumber: string,
    accountNumberCci: string,
    isMancomunada: boolean,
    documentTypeManId: number,
    documentNumberMan: string,
    nameMan: string,
    lastNameMan: string,
    status: boolean,
    vinculo: string
}

export interface DestinationSplit {
  account: ProfileBanks;
  amount: number;
}

export interface EditAmountDialogData {
  title?: string;
  currency: 'PEN' | 'USD';
  maxAmount: number;
  initialAmount: number;
}

export interface ProfileBanksTable {
    documentTypes: DocumentType[];
    banks: Banks[];
    companyBanks: CompanyBanks[];
    activities: Activities[];
    positions: Positions[];
}