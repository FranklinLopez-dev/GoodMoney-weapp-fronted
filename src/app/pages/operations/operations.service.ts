import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Operation, OperationDTO, OperationTable, ResponseOperationJsonDTO } from 'src/app/core/models/operations/operations.model';
import { Contability, SBS } from 'src/app/core/models';

export interface RequisitoSbs {
  requiereDj: boolean;
  /** 'Individual' (por su monto) | 'Acumulado' (el mes cruza el umbral) | null */
  motivo: string | null;
  cubiertaPorMes: boolean;
  umbralIndividualUsd: number;
  umbralAcumuladoUsd: number;
  acumuladoMesUsd: number;
  /** La declaración PEP no está vigente (vencida o nunca hecha): hay que renovarla. */
  requiereDeclaracionPep?: boolean;
  pepDeclaradoAt?: string | null;
  pepVigenciaDias?: number;
}

/** Cotización sellada por el servidor (POST operations/cotizaciones). */
export interface Cotizacion {
  id: number;
  typeOperation: '1' | '2';
  monto: number;
  total: number;
  inputChange: 'USD' | 'PEN';
  tasa: number;
  tasaBase: number;
  couponId: number | null;
  discount: number;
  expiresAt: string;
  segundosRestantes: number;
}

@Injectable({
  providedIn: 'root',
})
export class OperationsService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getOperationTable(): Observable<OperationTable> {
    return this.http
      .get<OperationTable>(`${this.baseUrl}/api/operations/table`)
      .pipe(
        map(table => ({
          ...table,
          banks: table.banks.map(bank => ({
            ...bank,
            icon: `data:image/jpeg;base64,${bank.icon}`
          })),
        })),
        shareReplay(1)
      );
  }

  /** Sella la cotización: el servidor fija tipo de cambio, montos y hasta cuándo valen. */
  public cotizar(dto: { typeOperation: '1' | '2'; monto: number; inputChange: string; couponId: number | null }): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.baseUrl}/api/operations/cotizaciones`, dto);
  }

  public save(payload: Operation): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/operations`, payload, { responseType: 'text' });
  }

  public saveAdmi(payload: Operation): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/operations/admin-form`, payload, { responseType: 'text' });
  }

  public cancel(payload: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations/cancel`, payload, { responseType: 'text' });
  }

  public update(payload: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations`, payload, { responseType: 'text' });
  }

  /** Si la operación por registrar necesita declaración jurada SBS: lo decide el servidor (umbrales del RO). */
  requisitoSbs(montoUsd: number): Observable<RequisitoSbs> {
    return this.http.get<RequisitoSbs>(`${this.baseUrl}/api/operations/sbs/requisito`, {
      params: new HttpParams().set('montoUsd', montoUsd)
    });
  }

  /** La declaración jurada de una operación propia (formato oficial SBS). */
  djPdf(operationId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/operations/${operationId}/dj.pdf`, { responseType: 'blob' });
  }

  public saveDate(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/operations/save-date`, null, {
      responseType: 'text'
    });
  }

  search(
    status: string,
    type: string,
    starDate: string,
    endDate: string,
    pageIndex: number,
    pageSize: number
  ): Observable<HttpResponse<OperationDTO>> {
    const params = parametrosDePagina(pageIndex, pageSize);

    return this.http.get<OperationDTO>(`${this.baseUrl}/api/operations/${status}/${type}/${starDate}/${endDate}`, {
      params,
      observe: 'response'
    });
  }

  searchAdmi(
    status: string,
    type: string,
    starDate: string,
    endDate: string,
    pageIndex: number,
    pageSize: number,
    client: string
  ): Observable<HttpResponse<OperationDTO>> {
    const params = parametrosDePagina(pageIndex, pageSize)
      .set('clientSearch', client);

    return this.http.get<OperationDTO>(`${this.baseUrl}/api/operations/all/${status}/${type}/${starDate}/${endDate}`, {
      params,
      observe: 'response'
    });
  }

  getById(id: number): Observable<Operation> {
    return this.http.get<Operation>(`${this.baseUrl}/api/operations/one/${id}`);
  }

  getByIdAdmi(id: number): Observable<Operation> {
    return this.http.get<Operation>(`${this.baseUrl}/api/operations/admin/one/${id}`);
  }

  public confirmRec(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/operations/admin/email/transferencia-recibida/${id}`, null, { responseType: 'text' });
  }

  public confirmarTransferenciaEnviada(operation: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations/admin/email/transferencia-enviada`, operation, { responseType: 'text' });
  }

  public updateCancelarOperationDTO(operation: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations/admin/cancel`, operation, { responseType: 'text' });
  }

  public updateOperationCompleted(operation: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations/admin/completed`, operation, { responseType: 'text' });
  }

  public updateOperationReenviar(operation: Operation): Observable<ResponseOperationJsonDTO> {
    return this.http.put<ResponseOperationJsonDTO>(`${this.baseUrl}/api/operations/admin/completed/reenviar`, operation, { responseType: 'json' });
  }

  public updateOperationDTO(operation: Operation): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/operations/admin`, operation, { responseType: 'text' });
  }

  public getSBS(year: number, month: number): Observable<SBS[]> {
    return this.http.get<SBS[]>(`${this.baseUrl}/api/operations/sbs-by-month/${year}/${month}`);
  }

  public getContability(year: number, month: number): Observable<Contability[]> {
    return this.http.get<Contability[]>(`${this.baseUrl}/api/operations/contability-by-month/${year}/${month}`);
  }

}
