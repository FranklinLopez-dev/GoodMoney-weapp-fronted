import { inject, Injectable } from "@angular/core";
import { CompanyService } from "./company.service";
import { forkJoin, tap } from "rxjs";
import { CompanyStore } from "./company.store";
import { CountryService } from "src/app/shared/services/country.service";
import { SeriesStore } from "./components/company-tabs/tabs/company-series/series.store";

@Injectable({ providedIn: 'root' })
export class CompanyResolver {
  private service = inject(CompanyService);
  private countryService = inject(CountryService);
  private store = inject(CompanyStore);
  private storeSerie = inject(SeriesStore);

  resolve() {
    return forkJoin({
      countries: this.countryService.getCountries(),
      company: this.service.get(),
      tables: this.service.getTables()
    }).pipe(
      tap(({ company, tables }) => {
        this.store.setCompany(company);
        this.store.setTables(tables);
        this.storeSerie.set(tables.series || []);
      })
    );
  }
}
