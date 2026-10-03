import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JwtPayload } from '../models/security/auth.model';
import { decodeToken, getToken } from './token.utils';

@Injectable({ providedIn: 'root' })
export class AuthStore {

  private _user$ = new BehaviorSubject<JwtPayload | null>(null);
  readonly user$ = this._user$.asObservable();

  constructor() {
    const token = getToken();
    if (token) {
      this._user$.next(decodeToken<JwtPayload>(token));
    }
  }

  setToken(token: string): void {
    const payload = decodeToken<JwtPayload>(token);
    this._user$.next(payload);
  }

  clear(): void {
    this._user$.next(null);
  }

  isAuthenticated(): boolean {
    return !!this._user$.value;
  }

  hasPermission(permission: string): boolean {
    return !!this._user$.value?.[permission];
  }

  /** El backend marca asi a los usuarios que nacen con contrasena por defecto. */
  mustChangePassword(): boolean {
    return this._user$.value?.['MustChangePassword'] === 'true';
  }
}
