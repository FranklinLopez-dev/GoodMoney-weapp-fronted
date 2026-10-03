import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Company, CompanyTable } from "src/app/core/models";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get() {
    return this.http.get<Company>(`${this.baseUrl}/api/companies`);
  }

  getClient() {
    return this.http.get<Company>(`${this.baseUrl}/api/companies/client`);
  }

  update(data: Partial<Company>) {
    return this.http.put(`${this.baseUrl}/api/companies`, data, { responseType: 'text' });
  }

  getTables() {
    return this.http.get<CompanyTable>(
      `${this.baseUrl}/api/companies/tables`
    );
  }
}
