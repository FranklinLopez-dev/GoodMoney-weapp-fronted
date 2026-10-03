import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExchangeRate } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private baseUrl = `${environment.apiUrl}/api/exchange-rates`;

  constructor(private http: HttpClient) {}

  getAll(startDate: string, endDate: string): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/${startDate}/${endDate}`);
  }

  getOne(): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(`${this.baseUrl}/last-exchange-rate`);
  }

  create(data: Partial<ExchangeRate>): Observable<string> {
    return this.http.post(this.baseUrl, data, { responseType: 'text' });
  }
}
