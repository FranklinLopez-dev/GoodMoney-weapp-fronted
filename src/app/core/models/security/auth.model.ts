import { Activities, Banks, CompanyBanks, DocumentType, Positions, Ubigeo } from "../index";

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  /** Permite renovar el acceso sin volver a pedir la contraseña. */
  refreshToken?: string;
  expiration: string;
  /** El resto del API responde 403 hasta que cambie la contrasena. */
  mustChangePassword?: boolean;
  /** La cuenta tiene verificación en dos pasos: falta el código del correo. */
  requiresTwoFactor?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmed: string;
}

export interface AuthTable {
  documentTypes: DocumentType[];
  activities: Activities[];
  positions: Positions[];
  departaments: Ubigeo[];
  banks: Banks[];
  companyBanks: CompanyBanks[];
}

export interface AuthRequest {
  email: string;
}

export interface DniResponse {
  success: boolean;
  data: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
  };
}

export interface RucResponse {
  success: boolean;
  data: {
    direccion: string;
    direccion_completa: string;
    ruc: string;
    nombre_o_razon_social: string;
    estado: string;
    condicion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    ubigeo_sunat: string;
    es_agente_de_retencion: string;
    ubigeo: string[];
  };
  source: string;
}

export interface DocumentRequest {
  documentTypeId: string;
  documentNumber: string;
}

export interface ForgotPasswordRequest {
  email: string;
  reCaptchaToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  newPasswordConfirmed: string;
}

export interface ConfirmAccountRequest {
  email: string;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  names: string;
  lastNames?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  reCaptchaToken?: string;
  documentTypeId: number;
  documentNumber: string;
  country: string;
  departament: string;
  province: string;
  district: string;
  address: string;
  isPep: boolean;
  institution?: string;
  cargo?: string;
  positionId?: number;
  activityId?: number;
  profileBanks: any[];
  documentTypeRepId?: number;
  documentNumberRep?: string;
  namesRep?: string;
  lastNamePaternoRep?: string;
  lastNameMaternoRep?: string;
  lastNamesRep?: string;
  cellPhone: string;
  dateOfBirth: Date;
  documentPhotoFrontByte?: string;
  documentPhotoReverseByte?: string;
  profileId?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  [claim: string]: any;
}