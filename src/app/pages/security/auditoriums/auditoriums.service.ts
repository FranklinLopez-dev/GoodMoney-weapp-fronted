import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Auditoriums } from 'src/app/core/models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditoriumsService {
  private baseUrl = `${environment.apiUrl}/api/auditoriums`;

  constructor(private http: HttpClient) {}

  search(
    page: number,
    recordsByPage: number,
    startDate: string,
    endDate: string
  ): Observable<HttpResponse<Auditoriums[]>> {

    const params = new HttpParams({
      fromObject: {
        Page: page + 1,
        RecordsByPage: recordsByPage,
        StartDate: startDate,
        EndDate: endDate
      }
    });

    return this.http.get<Auditoriums[]>(
      `${this.baseUrl}/search`,
      {
        params,
        observe: 'response'
      }
    );
  }
}