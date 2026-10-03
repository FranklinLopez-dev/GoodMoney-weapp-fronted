import { Actor } from "../common/actor.model";
import { Sunat } from "../common/utils.model";
import { ProfileBanks } from "../profiles/profile-banks.model";
import { Profile } from "../profiles/profile.model";
import { Banks } from "../settings/banks.model";
import { CompanyBanks } from "../settings/company-banks.model";
import { Company } from "../settings/company.model";
import { DocumentType } from "../settings/document-type.model";
import { ExchangeRate } from "../settings/exchange-rate.model";
import { PaymentConditions } from "../settings/payment-conditions.model";

export interface Operation {
    id: number;
    eProfileNames: string,
    eProfileCellPhone: string,
    eProfileLastNames: string,
    eProfileId: number,
    eProfileProfilePhoto: string,
    eProfileDocumentNumber: string,
    eProfileDocumentTypeName: string,
    eProfile: Profile,
    createdByUser: Actor,
    processedByUser: Actor,
    transferSentByUser: Actor,
    receiptConfirmedByUser: Actor,
    invoicedByUser: Actor,
    finalizedByUser: Actor,
    cancelledByUser: Actor | null,
    typeOperation: string;
    monto: number;
    tipoCambio: number;
    total: number;
    profileBankClient1Id: number;
    operationBanks: OperationBanks[];
    typeDocu: string;
    serie: string;
    correlative: number;
    pdf: string;
    xml: string;
    cdr: string;
    flagEnvio: boolean;
    couponId: number;
    discount: number;
    typeMpodera: number;
    companyBankId: number;
    companyBankId2: number;
    codeOperation: string;
    operationImage: string;
    operationImageByte: any;
    codeOperationAdmi: string;
    operationImageAdmi: string;
    operationImageAdmiByte: any;
    loadingEmail1: boolean;
    loadingEmail2: boolean;
    sendEmail1: boolean;
    sendEmail2: boolean;
    dateCreation: Date;
    processDate: Date;
    transferSentDate: Date;
    receiptConfirmedDate: Date;
    invoiceDate: Date;
    finalizationDate: Date;
    cancellationDate: Date;
    profileBankClient1: ProfileBanks;
    companyBank: CompanyBanks;
    companyBank2: CompanyBanks;
    loadingConfirmar: boolean;
    loadingCancelar: boolean;
    status: string;
    origenFondo: string;
    isRecordedForSBS: boolean;
    /** Tiene declaración jurada SBS: la suya o la del mes que la cubre. */
    tieneDj?: boolean;
    additionalDataForSBS: string;
    isSuspicious: boolean;
    issueDate: Date;
    paymentConditionId: number;
    message: string;
    isFirstOperation: boolean;
    /** En proceso: minutos que lleva esperando, contados por el servidor (solo en la bandeja). */
    esperaMinutos?: number | null;
    /** Registrada: minutos que le quedan para transferir; negativo = venció (solo en la bandeja). */
    venceEnMinutos?: number | null;
    /** Estado KYC de la persona que opera (solo en la bandeja). */
    personKycEstado?: string | null;
}

export interface OperationTable {
    exchangeRate: ExchangeRate;
    eProfile: Profile;
    companyBanks: CompanyBanks[],
    company: Company,
    sunat: Sunat,
    isClosed: boolean,
    monthlyAmount: number,
    banks: Banks[],
    documentTypes: DocumentType[],
    isProceso: boolean,
    paymentConditions: PaymentConditions[],
    columns: Columns[]
}

export interface OperationBanks {
    id: number;
    profileBankClient2: ProfileBanks;
    profileBankClient2Id: number;
    amount: number;
    isCopiar: boolean;
    operationImage: string;
    operationImageByte: any;
    codeOperation: string;
    companyBankId: number;
    companyBanks: CompanyBanks;
}

export interface OperationDTO {
    operations: Operation[];
    registradas: number;
    proceso: number;
    finalizadas: number;
    canceladas: number;
    /** Minutos que lleva esperando la operación en proceso más antigua. */
    procesoEsperaMinutos?: number | null;
}

export interface ResponseOperationJsonDTO {
    success: boolean;
    data: ResponseOperationDataJsonDTO;
    links: ResponseOperationLinkJsonDTO;
}

export interface ResponseOperationDataJsonDTO {
    number: string;
    filename: string;
    external_id: string;
    number_to_letter: string;
    hash: string;
    qr: string;
}

export interface ResponseOperationLinkJsonDTO {
    xml: string;
    pdf: string;
    cdr: string;
}

export interface Columns {
    clave: string;
    valor: string;
}