import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, catchError, tap, of } from 'rxjs';
import { Company } from 'src/app/core/models';
import { CompanyService } from '../settings/company/company.service';
import { AuthCompanyStore } from './auth-company.store';

@Injectable({
  providedIn: 'root',
})
export class AuthCompanyResolver implements Resolve<Company | null> {
  constructor(
    private companyService: CompanyService,
    private companyStore: AuthCompanyStore
  ) {}

  resolve(): Observable<Company | null> {
    return this.companyService.getClient().pipe(
      tap(company => this.companyStore.setCompany(company)),
      catchError(() => {
        this.companyStore.setCompany(null);
        return of(null);
      })
    );
  }
}
