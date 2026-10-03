import { inject, Injectable } from "@angular/core";
import { forkJoin } from "rxjs";
import { AuthService } from "src/app/core/auth/auth.service";
import { CountryService } from "src/app/shared/services/country.service";

@Injectable({ providedIn: 'root' })
export class RegisterResolver {
  private service = inject(AuthService);
  private countryService = inject(CountryService);

  resolve() {
    return forkJoin({
      countries: this.countryService.getCountries(),
      tables: this.service.getAuthTable()
    });
  }
}
