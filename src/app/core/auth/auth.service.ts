import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthRequest, AuthResponse, AuthTable, ConfirmAccountRequest, DniResponse, DocumentRequest, ForgotPasswordRequest, RegisterRequest, ChangePasswordRequest,
  ResetPasswordRequest, RucResponse } from '../models/security/auth.model';
import { EmailVerificationResponse } from '../models/security/email-verification.model';
import { removeRefreshToken, removeToken, setToken } from './token.utils';
import { AuthStore } from './auth.store';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/services/socket.service';
import { ArchivosPrivadosService } from 'src/app/shared/services/archivos-privados.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = environment.apiUrl;

  private _authTable = signal<AuthTable | null>(null);
  readonly authTable = this._authTable.asReadonly();
  private dniCache = new Map<string, DniResponse>();
  private rucCache = new Map<string, RucResponse>();
  private _emailSignUp = signal(null as string | null);
  readonly emailSignUp = this._emailSignUp.asReadonly();

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private http: HttpClient,
    private authStore: AuthStore,
    private socketService: SocketService,
    private archivos: ArchivosPrivadosService
  ) { }

  login(payload: AuthRequest) {
    // withCredentials: el refresco vuelve en una cookie HttpOnly; sin esto ni se guarda ni se manda.
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/login`, payload, { withCredentials: true })
      .pipe(
        tap(res => this.guardarSesion(res))
      );
  }

  /** Renueva el acceso; el backend rota, o sea que invalida el refresco entregado. */
  refreshSession(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => this.guardarSesion(res)));
  }

  /** Segundo paso cuando la cuenta tiene verificación en dos pasos. */
  loginTwoFactor(email: string, password: string, code: string) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/login-2fa`, { email, password, code }, { withCredentials: true })
      .pipe(tap(res => this.guardarSesion(res)));
  }

  getTwoFactor(): Observable<{ enabled: boolean }> {
    return this.http.get<{ enabled: boolean }>(`${this.baseUrl}/api/accounts/two-factor`);
  }

  /** Manda el código al correo; el API no dispara correos solo con el token, pide la contraseña. */
  sendTwoFactorCode(password: string): Observable<{ enviado: boolean }> {
    return this.http.post<{ enviado: boolean }>(
      `${this.baseUrl}/api/accounts/two-factor/send-code`, { password });
  }

  /** La contraseña es obligatoria siempre; el código, solo al encender. */
  setTwoFactor(enabled: boolean, password: string, code?: string): Observable<{ enabled: boolean }> {
    return this.http.post<{ enabled: boolean }>(
      `${this.baseUrl}/api/accounts/two-factor`, { enabled, password, code });
  }

  private guardarSesion(res: AuthResponse): void {
    setToken(res.token);
    this.authStore.setToken(res.token);
  }

  registerNatural(payload: RegisterRequest) {
    return this.http.post(
      `${this.baseUrl}/api/accounts/create/natural`,
      payload
    );
  }

  registerNaturalAdmi(payload: RegisterRequest) {
    return this.http.post(
      `${this.baseUrl}/api/accounts/create/natural-admi`,
      payload
    );
  }

  setEmailSignUp(email: string | null) {
    this._emailSignUp.set(email);
  }

  registerJuridico(payload: RegisterRequest) {
    return this.http.post(
      `${this.baseUrl}/api/accounts/create/juridico`,
      payload
    );
  }

  registerJuridicoAdmi(payload: RegisterRequest) {
    return this.http.post(
      `${this.baseUrl}/api/accounts/create/juridico-admi`,
      payload
    );
  }

  getAuthTable(): Observable<AuthTable> {
    if (this._authTable()) {
      return of(this._authTable()!);
    }

    return this.http
      .get<AuthTable>(`${this.baseUrl}/api/accounts/tables`)
      .pipe(
        map(table => ({
          ...table,
          banks: table.banks.map(bank => ({
            ...bank,
            icon: `data:image/jpeg;base64,${bank.icon}`
          }))
        })),
        tap(data => this._authTable.set(data))
      );
  }


  getDni(dni: string): Observable<DniResponse> {
    const cached = this.dniCache.get(dni);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<DniResponse>(`${this.baseUrl}/api/utils/dni/${dni}`)
      .pipe(
        tap(res => this.dniCache.set(dni, res))
      );
  }

  getRuc(ruc: string): Observable<RucResponse> {
    const cached = this.rucCache.get(ruc);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<RucResponse>(`${this.baseUrl}/api/utils/ruc/${ruc}`)
      .pipe(
        tap(res => this.rucCache.set(ruc, res))
      );
  }

  validarEmail(payload: AuthRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/accounts/validar-email`, payload);
  }

  /** Paso 1 del registro: manda al correo el codigo de 6 digitos. */
  sendVerificationCode(email: string): Observable<EmailVerificationResponse> {
    return this.http.post<EmailVerificationResponse>(
      `${this.baseUrl}/api/accounts/send-verification-code`,
      { email }
    );
  }

  /** Comprueba el codigo. El API tambien lo revalida al crear la cuenta. */
  verifyCode(email: string, code: string): Observable<EmailVerificationResponse> {
    return this.http.post<EmailVerificationResponse>(
      `${this.baseUrl}/api/accounts/verify-code`,
      { email, code }
    );
  }

  validarDocumento(payload: DocumentRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/accounts/validar-documento`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/accounts/reset-password`, payload);
  }

  /** Devuelve un token nuevo: el anterior lleva MustChangePassword y el API lo sigue rechazando. */
  changePassword(payload: ChangePasswordRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/change-password`, payload)
      .pipe(
        tap(res => {
          setToken(res.token);
          this.authStore.setToken(res.token);
        })
      );
  }

  resetPassword(payload: ResetPasswordRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/reset-password-confirmed`, payload)
      .pipe(
        tap(res => {
          setToken(res.token);
          this.authStore.setToken(res.token);
        })
      );
  }

  confirmAccount(payload: ConfirmAccountRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/api/accounts/enabled-email-account`, payload)
      .pipe(
        tap(res => {
          setToken(res.token);
          this.authStore.setToken(res.token);
        })
      );
  }

  resendEmailConfirmation(email: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/accounts/resend-email-confirmation`,
      { email }
    );
  }

  logout(): void {
    // Cierra el hub antes de limpiar la sesion: si no, la conexion queda viva en el login y un
    // usuario que entre despues en la misma pestana reutilizaria el socket del anterior.
    this.socketService.stop();

    // Si falla igual se limpia la sesion local, que es lo que el usuario espera al pulsar salir.
    this.http.post(`${this.baseUrl}/api/accounts/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => { } });

    removeToken();
    // Limpia el resto del esquema anterior, que guardaba el refresco aqui.
    removeRefreshToken();
    this.authStore.clear();
    this.archivos.limpiar();
    this.ngZone.run(() => {
      this.router.navigate(['/authentication/login']);
    });
  }
}
