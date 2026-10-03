import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CompanyBilling } from "src/app/core/models";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class CompanyBillingService {
  private baseUrl = `${environment.apiUrl}/api/companies/billing`;

  constructor(private http: HttpClient) { }

  get() {
    return this.http.get<CompanyBilling>(this.baseUrl);
  }

  update(data: CompanyBilling) {
    return this.http.put(this.baseUrl, data, { responseType: 'text' });
  }
}
