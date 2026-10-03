import { Injectable } from "@angular/core";
import { SocketService } from "src/app/services/socket.service";

@Injectable({ providedIn: 'root' })
export class ProfilesRealtimeService {

  constructor(private socket: SocketService) {}

  addProfileValidate(): Promise<void> {
    return this.socket.emit('AddProfilesValidate');
  }
  
}
