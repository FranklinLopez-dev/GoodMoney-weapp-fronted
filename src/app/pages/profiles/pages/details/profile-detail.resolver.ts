import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { of, finalize, tap } from 'rxjs';
import { ProfilesService } from '../../profiles.service';
import { ProfilesStore } from '../../profiles.store';

@Injectable({ providedIn: 'root' })
export class ProfileDetailResolver {

  private service = inject(ProfilesService);
  private store = inject(ProfilesStore);

  resolve(route: ActivatedRouteSnapshot) {

    const idParam = route.paramMap.get('id');

    if (idParam === 'new') {
      this.store.setCurrent(null);
      return of(null);
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      return of(null);
    }

    const cached = this.store.findById(id);
    if (cached) {
      this.store.setCurrent(cached.profile);
      return of(cached);
    }

    this.store.setLoading(true);

    return this.service.getById(id).pipe(
      tap(profile => this.store.setCurrent(profile)),
      finalize(() => this.store.setLoading(false))
    );
  }
}
