import { Actor } from "../common/actor.model";
import { Profile } from "../profiles/profile.model";

export interface BookClaim {
  id: number;
  email: string;
  names?: string;
  lastNamePaterno?: string;
  lastNameMaterno?: string;
  documentTypeId: number;
  documentNumber: string;
  address?: string;
  district?: string;
  province?: string;
  departament?: string;
  phone?: string;
  serviceType: string;          
  operationNumber: number;
  productAmount: number;
  claimType: number;            
  claimDetail: string;
  request: string;
  bookClaimImage?: string;     
  bookClaimImageByte?: any; 
  status: string;
  dateCreation: string;
  bookClaimResponses?: BookClaimResponse[];
  createdByUser: Actor;
}

export interface BookClaimResponse
{
    id: number;
    bookClaimId: number;
    responsibleId: string | null;
    responsible: Actor | null;
    responseText: string;
    attachmentPath: string;
    attachmentPathByte: any;
    dateResponse: string;
}
