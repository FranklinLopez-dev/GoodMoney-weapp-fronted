import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { forkJoin, tap } from 'rxjs';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { ProfilesUserStore } from './profiles.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { UsersService } from '../users.service';

@Injectable({ providedIn: 'root' })
export class ProfilesResolver {

  private service = inject(ProfilesService);
  private usersService = inject(UsersService);
  private store = inject(ProfilesUserStore);

  resolve(route: ActivatedRouteSnapshot) {
    const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
    const id = route.paramMap.get('userId')!;

    this.store.setLoading(true);

    return forkJoin({
      profiles: this.service.getAllId('', pageIndex, id),
      user: this.usersService.getId(id)
    }).pipe(
      tap(({ profiles, user }) => {

        this.store.setUser(user); 

        const data = profiles.body ?? [];
        const totalRecords = totalDelEncabezado(profiles.headers);

        this.store.set(id, data);
        this.store.setPagination(totalRecords, pageIndex);
        this.store.setLoading(false);
      })
    );
  }
}
