import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompanyBanks } from 'src/app/core/models';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class CompanyBanksService extends ApiCrudService<CompanyBanks> {
    constructor() {
        super('company-companyBanks');
    }

    getAllClient(): Observable<CompanyBanks[]> {
        return this.http.get<CompanyBanks[]>(`${this.baseUrl}/client`);
    }
}
