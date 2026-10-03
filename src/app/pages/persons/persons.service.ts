import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { parametrosDePagina } from 'src/app/shared/utils/paginacion-backend';

export interface PersonaListado {
    id: number;
    documentType: string;
    documentNumber: string;
    personType: string;
    fullName: string;
    isValidated: boolean;
    isBlackListed: boolean;
    pendingIdentification: boolean;
    accounts: number;
    operations: number;
    createdAt: string;
}

export interface CuentaDePersona {
    id: number;
    applicationUserId: string;
    email: string;
    /** A quién autoriza la relación. Solo viene en la lista de respaldos pendientes. */
    personId: number | null;
    personDocumentNumber: string | null;
    personFullName: string | null;
    nature: string;
    isDefault: boolean;
    from: string;
    until: string | null;
    authorizedByPersonId: number | null;
    authorizedByPerson: string | null;
    supportType: string | null;
    pendingSupport: boolean;
    thirdPartyReason: string | null;
    operations: number;
}

export interface RepresentanteDePersona {
    personId: number;
    documentNumber: string;
    fullName: string;
    position: string | null;
    from: string;
    until: string | null;
}

export interface ExpedientePlaft {
    from: string;
    until: string | null;
    isPep: boolean;
    pepPosition: string | null;
    pepInstitution: string | null;
    isRelativePep: boolean;
    activity: string | null;
    position: string | null;
    maritalStatus: string | null;
    sourceOfFunds: string | null;
    riskLevel: string | null;
}

export interface DocumentoDePersona {
    id: number;
    type: string;
    originalName: string | null;
    uploadedAt: string;
}

export interface PersonaDetalle {
    id: number;
    documentTypeId: number;
    documentType: string;
    documentNumber: string;
    personType: string;
    fullName: string;
    names: string | null;
    lastNamePaterno: string | null;
    lastNameMaterno: string | null;
    businessName: string | null;
    birthDate: string | null;
    country: string | null;
    departament: string | null;
    province: string | null;
    district: string | null;
    address: string | null;
    isValidated: boolean;
    isBlackListed: boolean;
    pendingIdentification: boolean;
    createdAt: string;
    accounts: CuentaDePersona[];
    representatives: RepresentanteDePersona[];
    compliance: ExpedientePlaft | null;
    complianceHistory: ExpedientePlaft[];
    documents: DocumentoDePersona[];
    operations: number;
    operationsTotal: number;
    lastOperation: string | null;
}

/** Mientras `cuadra` sea true, volver atrás es solo desplegar la versión anterior. */
export interface Conciliacion {
    personas: number;
    personasConDocumento: number;
    personasSinDocumento: number;
    juridicas: number;
    representantes: number;
    expedientes: number;
    expedientesVigentes: number;
    documentos: number;
    perfiles: number;
    perfilesConCuenta: number;
    fichasSueltas: number;
    relaciones: number;
    titulares: number;
    autorizadas: number;
    respaldosPendientes: number;
    cuentasConPerfil: number;
    cuentasConRelacion: number;
    operaciones: number;
    operacionesSinPersona: number;
    operacionesSinRelacion: number;
    operacionesDeTerceros: number;
    malPredeterminada: number;
    malTitular: number;
    autorizadaSinQuien: number;
    operacionesConDocumentoDistinto: number;
    cuadra: boolean;
}

export interface InformeConciliacion {
    cuentasRecorridas: number;
    cuentasConCambios: number;
    personasCreadas: number;
    personasActualizadas: number;
    relacionesCreadas: number;
    relacionesActualizadas: number;
    representantesCreados: number;
    documentosCreados: number;
    expedientesCreados: number;
    cuentasBancariasEnlazadas: number;
    operacionesSelladas: number;
    /** Tiene que acabar en 0. */
    operacionesSinPersona: number;
    avisos: string[];
}

export interface Filtro {
    valor?: string;
    tipo?: string;
    pendienteIdentificacion?: boolean;
    enListaNegra?: boolean;
    page?: number;
    recordsByPage?: number;
}

/** Los parámetros se llaman `Page` y `RecordsByPage` como el `PaginationDTO`: con otro nombre se ignoran. */
@Injectable({ providedIn: 'root' })
export class PersonsService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/persons`;

    private paginacion(filtro: Filtro): HttpParams {
        return parametrosDePagina(filtro.page ?? 0, filtro.recordsByPage ?? 25);
    }

    listado(filtro: Filtro): Observable<HttpResponse<PersonaListado[]>> {
        let params = this.paginacion(filtro);
        if (filtro.valor) params = params.set('valor', filtro.valor);
        if (filtro.tipo) params = params.set('tipo', filtro.tipo);
        if (filtro.pendienteIdentificacion != null)
            params = params.set('pendienteIdentificacion', filtro.pendienteIdentificacion);
        if (filtro.enListaNegra != null)
            params = params.set('enListaNegra', filtro.enListaNegra);

        return this.http.get<PersonaListado[]>(this.baseUrl, { params, observe: 'response' });
    }

    detalle(id: number): Observable<PersonaDetalle> {
        return this.http.get<PersonaDetalle>(`${this.baseUrl}/${id}`);
    }

    porDocumento(documentTypeId: number, documentNumber: string): Observable<PersonaDetalle> {
        return this.http.get<PersonaDetalle>(`${this.baseUrl}/by-document/${documentTypeId}/${documentNumber}`);
    }

    /** Los clientes dados por validados sin documento real. En campo, 411. */
    pendientesDeIdentificacion(filtro: Filtro): Observable<HttpResponse<PersonaListado[]>> {
        return this.http.get<PersonaListado[]>(`${this.baseUrl}/pendientes-identificacion`,
            { params: this.paginacion(filtro), observe: 'response' });
    }

    /** Las autorizaciones para operar por cuenta de un tercero sin carta poder. En campo, 384. */
    respaldosPendientes(filtro: Filtro): Observable<HttpResponse<CuentaDePersona[]>> {
        return this.http.get<CuentaDePersona[]>(`${this.baseUrl}/respaldos-pendientes`,
            { params: this.paginacion(filtro), observe: 'response' });
    }

    conciliacion(): Observable<Conciliacion> {
        return this.http.get<Conciliacion>(`${this.baseUrl}/conciliacion`);
    }

    conciliar(): Observable<InformeConciliacion> {
        return this.http.post<InformeConciliacion>(`${this.baseUrl}/conciliar`, {});
    }
}
