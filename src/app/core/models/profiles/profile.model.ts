import { Ubigeo } from "../common/ubigeo.model";
import { Operation } from "../operations/operations.model";
import { Roles } from "../security/roles.model";
import { Activities } from "../settings/activities.model";
import { DocumentType } from "../settings/document-type.model";
import { Positions } from "../settings/positions.model";
import { ProfileBanks } from "./profile-banks.model";

export interface Profile {
    id: number;
    applicationUserId: string;
    documentTypeId: number;
    documentTypeName: string;
    documentNumber: string;
    documentTypeIsNatural: boolean;
    names: string;
    lastNames: string;
    lastNamePaterno: string;
    lastNameMaterno: string;
    address: string;
    phone: string;
    cellPhone: string;
    email: string;
    country: string;
    departament: string;
    province: string;
    district: string;
    isPep: boolean;
    cargo: string;
    institution: string;
    positionId: number;
    positionDescription: string;
    flagCheck: boolean;
    isAdmin: boolean;
    profilePhoto: string;
    profilePhotoByte: any;
    isValidate: boolean;
    dateOfBirth: Date;
    activityId: number;
    activityDescription: string;
    flagEmail: boolean;
    documentTypeRepId: number;
    documentTypeRepName: string;
    documentNumberRep: string;
    namesRep: string;
    lastNamesRep: string;
    lastNamePaternoRep: string;
    lastNameMaternoRep: string;
    isFormIndividual: boolean;
    statusCivil: string;
    isFamiliarPep: boolean;
    documentPhotoReverse: string;
    documentPhotoFront: string;
    documentPhotoReverseByte: any;
    documentPhotoFrontByte: any;
    flagCellPhone: boolean;
    isValidateEmail: boolean;
    isValidateCellPhone: boolean;
    isWhatsapp: boolean;
    parientesPep: string;
    parientesFamiliarPep: string;
    documentType: DocumentType;
    typeOnline: string;
    operations: Operation[];
    profileBanks: ProfileBanks[];
    isBlackListed: boolean;
}

export interface Profiles {
    profile: Profile;
    proceso: number;
    finalizadas: number;
    canceladas: number;
}

export interface ProfileTables {
    documentTypes: DocumentType[];
    activities: Activities[];
    positions: Positions[];
    departaments: Ubigeo[];
    roles: Roles[]
}
