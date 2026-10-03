import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { tap, forkJoin } from 'rxjs';
import { ProfilesTablesService } from './profiles-tables.service';
import { ProfilesTablesStore } from './profiles-tables.store';
import { CountryService } from 'src/app/shared/services/country.service';

@Injectable({ providedIn: 'root' })
export class ProfilesTablesResolver implements Resolve<any> {

  private service = inject(ProfilesTablesService);
  private store = inject(ProfilesTablesStore);
  private countryService = inject(CountryService);

  resolve() {
    return forkJoin({
      countries: this.countryService.getCountries(),
      tables: this.service.getTables()
    }).pipe(
      tap(({ tables }) => {
        this.store.set(tables);
      })
    );
  }
}