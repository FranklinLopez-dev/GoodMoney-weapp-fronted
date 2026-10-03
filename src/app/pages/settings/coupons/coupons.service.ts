import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Coupons, Users } from 'src/app/core/models';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { ApiCrudService } from 'src/app/core/services/api-crud.service';

@Injectable({ providedIn: 'root' })
export class CouponsService extends ApiCrudService<Coupons> {
  constructor() {
    super('coupons');
  }

  getAllClient(): Observable<Coupons[]> {
    return this.http.get<Coupons[]>(`${this.baseUrl}/client`);
  }

  getUsers(searchTerm: string): Observable<Users[]> {
    const params = parametrosDePagina(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    return this.http.get<Users[]>(`${this.baseUrl}/filter-users/${searchTerm}`, { params });
  }

  getOne(id: number): Observable<Coupons> {
    return this.http.get<Coupons>(`${this.baseUrl}/${id}`);
  }

  getCouponsCode(code: string): Observable<Coupons> {
    return this.http.get<Coupons>(`${this.baseUrl}/get-coupon-by-code/${code}`);
  }
}
