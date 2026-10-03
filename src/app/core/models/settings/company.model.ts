import { Ubigeo } from "../common/ubigeo.model";
import { Serie } from "./serie.model";

export interface Company {
  id: number;
  codeSunat: string;
  ruc: string;
  name: string;
  tradeName: string;
  departament: string;
  province: string;
  district: string;
  address: string;
  phone: string;
  cellPhone: string;
  emailAdress: string;
  webSite: string;
  logo: any;
  country: string;
  limitOperation: number;
  webSiteApp: string;
  isClosed: boolean;
  openDate: Date;
  isDuplicated: boolean;
  operationTime: number;
  minAmount: number;
  maxAmount: number;
  isModalPublic: boolean;
  photoPublicPc: string;
  photoPublicPcByte: any;
  photoPublicTablet: string;
  photoPublicTabletByte: any;
  photoPublicPhone: string;
  photoPublicPhoneByte: any;
  isOneAccount: boolean;
  monthlyChange: number;
  isMaintenance: boolean;
  appIosUrl: string;
  appAndroidUrl: string;
  emailPrimaryColor: string;
  emailSecondaryColor: string;
  emailBackgroundColor: string;
  emailTextColor: string;
  emailFooterText: string;
  emailSupportEmail: string;
  emailLogoUrlByte: any;
  emailMascotUrlByte: any;
  emailLogoUrl: string;
  emailMascotUrl: string;
}

export interface CompanyTable {
  departaments: Ubigeo[];
  series: Serie[]
}

/** Aparte de Company: viajaba con la ficha entera a cualquiera con bussiness.index (SEGURIDAD.md, hallazgo 13). */
/** Lo que queda del endpoint companies/billing: el código de establecimiento. La clave SOL vive cifrada en api/fiscal. */
export interface CompanyBilling {
  codeSunat: string;
}