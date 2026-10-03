import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { filter, distinctUntilChanged } from 'rxjs';
import { ProfilesService } from '../pages/profiles/profiles.service';

@Injectable({ providedIn: 'root' })
export class SocketProfileService {

  constructor(
    private socketService: SocketService,
    private profileService: ProfilesService
  ) {}

  init(): void {
    this.socketService.connectionId$
      .pipe(
        filter(id => !!id),
        distinctUntilChanged()
      )
      .subscribe(id => {
        this.profileService
          .updateProfileSocket({ socketId: id! })
          .subscribe(() => {
            console.log('🔗 Socket registrado en perfil');
          });
      });
  }
}
