import { Injectable, inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { ProfilesService } from './profiles.service';
import { ProfilesStore } from './profiles.store';

@Injectable({ providedIn: 'root' })
export class ProfilesResolver {

  private service = inject(ProfilesService);
  private store = inject(ProfilesStore);

  resolve() {
    return this.service.getAll().pipe(
      tap({
        next: profiles => {
          this.store.set(profiles);
        }
      })
    );
  }
}
