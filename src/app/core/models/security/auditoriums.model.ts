import { Profile } from "../profiles/profile.model";
import { Users } from "./users.model";

/** Quien hizo algo: id y nombre. Ver `ActorDTO` en el API. */
export interface Actor { id: string; names: string; }

export interface Auditoriums {
  id: number;
  /** El actor de una pista de auditoría es una cuenta, no una persona: llega sin correo ni foto. */
  applicationUserId: string;
  applicationUser: Actor;

  targetUserId: string;
  targetUser: Users;

  /** Sobre que perfil se hizo. Sigue siendo un perfil: es el sujeto, no el actor. */
  targetProfileId: number;
  targetProfile: Profile;
  date: string; 
  category: string;
  action: string;
  oldValues: string;
  newValues: string;
  ipAddress: string;
  location: string;
  dispositivo: string;
  dispositivoType: string;
  plataforma: string;
  browser: string;
}

export interface AuditoriumsResponse {
  data: Auditoriums[];
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
}
