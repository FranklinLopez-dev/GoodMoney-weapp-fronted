import { Injectable } from "@angular/core";
import { SocketService } from "src/app/services/socket.service";

@Injectable({ providedIn: 'root' })
export class OperationsRealtimeService {

  constructor(private socket: SocketService) {}

  addNewOperation(): Promise<void> {
    return this.socket.emit('AddNewOperation');
  }

  removeOperation(): Promise<void> {
    return this.socket.emit('RemoveNewOperation');
  }
  
}
