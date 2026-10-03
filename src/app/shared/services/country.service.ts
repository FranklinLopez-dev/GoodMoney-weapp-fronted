import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Country } from 'src/app/core/models/common/country.model';
import countriesJson from 'src/assets/data/countries.json';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  private _countries = signal<Country[]>([]);

  readonly countries = this._countries.asReadonly();

  getCountries(): Observable<Country[]> {

    if (this._countries().length) {
      return of(this._countries());
    }

    const countries = [...(countriesJson as Country[])].sort((a, b) =>
      a.name.common.localeCompare(b.name.common)
    );

    this._countries.set(countries);

    return of(countries);
  }
}
