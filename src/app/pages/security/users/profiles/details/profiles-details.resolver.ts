import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { of, finalize, tap } from 'rxjs';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { ProfilesUserStore } from '../profiles.store';

@Injectable({ providedIn: 'root' })
export class ProfileDetailResolver {

  private service = inject(ProfilesService);
  private store = inject(ProfilesUserStore);

  resolve(route: ActivatedRouteSnapshot) {

    const userId = route.paramMap.get('userId');
    const profileIdParam = route.paramMap.get('profileId');

    if (!userId || !profileIdParam) {
      this.store.setCurrent(null);
      return of(null);
    }

    const profileId = Number(profileIdParam);
    if (isNaN(profileId)) {
      this.store.setCurrent(null, userId);
      return of(null);
    }

    const cached = this.store.findById(userId, profileId);
    if (cached) {
      this.store.setMode('view');
      this.store.setCurrent(cached, userId);
      return of(cached);
    }

    this.store.setLoading(true);

    return this.service.getById(profileId).pipe(
      tap(profile => {
        this.store.setMode('view');
        this.store.setCurrent(profile, userId);
      }),
      finalize(() => this.store.setLoading(false))
    );
  }
}
