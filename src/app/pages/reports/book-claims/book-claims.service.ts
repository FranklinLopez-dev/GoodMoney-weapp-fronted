import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BookClaim, BookClaimResponse } from 'src/app/core/models/reports/book-claims.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BookClaimsService {

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBookClaims(
    startDate: string,
    endDate: string,
    pageIndex: number,
    pageSize: number
  ): Observable<HttpResponse<BookClaim[]>> {
    return this.http.get<BookClaim[]>(
      `${this.baseUrl}/api/book-claims/${startDate}/${endDate}?Page=${pageIndex + 1}&RecordsByPage=${pageSize}`,
      { observe: 'response' }
    );
  }

  getBookClaimsAdmin(
    startDate: string,
    endDate: string,
    pageIndex: number,
    pageSize: number
  ): Observable<HttpResponse<BookClaim[]>> {
    return this.http.get<BookClaim[]>(
      `${this.baseUrl}/api/book-claims/all/${startDate}/${endDate}?Page=${pageIndex + 1}&RecordsByPage=${pageSize}`,
      { observe: 'response' }
    );
  }

  saveBookClaim(bookClaim: BookClaim): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/api/book-claims`,
      bookClaim,
      { responseType: 'text' }
    );
  }

  saveBookClaimResponse(bookClaim: BookClaimResponse): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/api/book-claims/response`,
      bookClaim,
      { responseType: 'text' }
    );
  }

  assignCode(id: number): Observable<string> {
    return this.http.put(
      `${this.baseUrl}/api/book-claims/assign/${id}`,
      null,
      { responseType: 'text' }
    );
  }

  getById(id: number): Observable<BookClaim> {
    return this.http.get<BookClaim>(`${this.baseUrl}/api/book-claims/${id}`);
  }

  updateBookClaim(bookClaim: BookClaim): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/book-claims`, bookClaim, { responseType: 'text' });
  }
}
