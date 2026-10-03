import { Injectable } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getToken } from 'src/app/core/auth/token.utils';

/** Hub del propio backend con el mismo JWT: el relay anterior no pedia autenticacion para el grupo "admin". */
@Injectable({ providedIn: 'root' })
export class SocketService {

  private hubConnection?: HubConnection;

  /** Promesa de la carga+arranque en curso, para no lanzarla dos veces. */
  private starting?: Promise<void>;

  /** Registros de `on`/`off` pedidos antes de que existiera la conexion. */
  private pending: Array<(hub: HubConnection) => void> = [];

  /** Si `stop()` entra mientras el `import()` sigue en vuelo, el callback ve que su generacion caduco y no conecta. */
  private gen = 0;

  private _connectionId$ = new BehaviorSubject<string | null>(null);
  connectionId$ = this._connectionId$.asObservable();

  start(): void {
    if (this.starting) return;

    const myGen = ++this.gen;

    this.starting = import('@microsoft/signalr').then(signalR => {
      if (myGen !== this.gen) return;

      const hub = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/hub/goodmoney`, {
          // El websocket no lleva cabeceras: SignalR manda el token por querystring y el backend solo lo acepta ahi.
          accessTokenFactory: () => getToken() ?? ''
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection = hub;

      // Los `on`/`off` que se pidieron mientras bajaba el paquete.
      for (const apply of this.pending) apply(hub);
      this.pending = [];

      return hub.start()
        .then(() => this._connectionId$.next(hub.connectionId))
        .catch(err => console.error('No se pudo conectar al hub', err));
    });
  }

  async emit(method: string, ...args: any[]): Promise<void> {
    await this.starting;
    if (!this.hubConnection) return;
    return this.hubConnection.invoke(method, ...args);
  }

  on<T = any>(event: string, callback: (data: T) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on(event, callback);
      return;
    }
    this.pending.push(hub => hub.on(event, callback));
  }

  off(event: string): void {
    if (this.hubConnection) {
      this.hubConnection.off(event);
      return;
    }
    this.pending.push(hub => hub.off(event));
  }

  stop(): void {
    this.gen++;
    this.hubConnection?.stop();
    this.hubConnection = undefined;
    this.starting = undefined;
    this.pending = [];
    this._connectionId$.next(null);
  }
}
