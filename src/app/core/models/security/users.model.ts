import { Profile } from "../profiles/profile.model";
import { Roles } from "./roles.model";

export interface Users {
  id: string;
  email: string;
  userName: string;
  names: string;
  lockoutEnabled: boolean;
  roles: Roles[],
  socketId: string,
  isValidate: boolean,
  emailConfirmed: boolean;
  typeOnline: string;
  profilesByValidate: number;
  photo: string;
  profile: Profile;
  createdAt: string;
  isBlackListed: boolean;
}

export interface Client {
  applicationUser: Users;
  profiles: Profile[];
}

export interface ClienteReporte {
  names: string;
  documentType: string | null;
  documentNumber: string | null;
  email: string;
  cellPhone: string | null;
  emailConfirmed: boolean;
  lockoutEnabled: boolean;
  isBlackListed: boolean;
}

export interface FiltrosClientes {
  busqueda: string;
  emailConfirmed: boolean | null;
  lockoutEnabled: boolean | null;
}

