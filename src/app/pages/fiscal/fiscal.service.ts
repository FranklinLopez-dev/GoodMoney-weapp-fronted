import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Configuración del emisor

export interface CertificadoFiscal {
    id: number;
    alias: string;
    ruc: string | null;
    titular: string;
    vigenteDesde: string;
    venceEl: string;
    diasParaVencer: number;
    estado: string;
    cargadoEl: string;
}

export interface ConfigFiscal {
    /** 0 = Beta, 1 = Producción. */
    ambiente: number;
    /** 0 = una por una, 1 = resumen diario. */
    modoBoletas: number;
    ubigeo: string | null;
    ruc: string;
    razonSocial: string;
    codigoEstablecimiento: string;
    certificado: CertificadoFiscal | null;
    solConfigurado: boolean;
    solUsuario: string | null;
    solVerificadoAt: string | null;
    validadoEnBeta: boolean;
    fechaValidacionBeta: string | null;
    faltaParaProduccion: string[];
    servidorPermiteProduccion: boolean;
    operacionesPorFacturar: number;
}

// Bandeja

export interface Comprobante {
    id: number;
    operationId: number;
    codigoOperacion: string;
    tipo: number;
    tipoNombre: string;
    numeroCompleto: string;
    fechaEmision: string;
    estado: number;
    estadoNombre: string;
    total: number;
    moneda: string;
    clienteDocTipo: string | null;
    clienteDocNumero: string | null;
    clienteNombre: string | null;
    ambiente: number;
    codigoRespuestaSunat: string | null;
    mensajeSunat: string | null;
    observacionesSunat: string | null;
    intentosEnvio: number;
    proximoIntentoAt: string | null;
    cdrPendiente: boolean;
    tieneCdr: boolean;
    documentoReferencia: string | null;
    esVigente: boolean;
    notificadoClienteAt: string | null;
    puedeEnviar: boolean;
    puedeReemitir: boolean;
    puedeDeclararResumen: boolean;
    puedeAnular: boolean;
    puedeDarDeBaja: boolean;
    puedeVerificarBaja: boolean;
}

export interface ResumenFiscal {
    pendientes: number;
    rechazados: number;
    bajasEnProceso: number;
    porFacturar: number;
    anulacionesPorAprobar: number;
    aceptadosHoy: number;
    ambiente: number;
}

export interface EntradaHistorial {
    fecha: string;
    accion: string;
    detalle: string;
    usuario: string;
}

export interface OperacionPorFacturar {
    id: number;
    codigoOperacion: string;
    fecha: string;
    typeOperation: string;
    monto: number;
    tipoCambio: number;
    total: number;
    cliente: string;
    documento: string;
}

export interface SolicitudAnulacion {
    id: number;
    operationId: number;
    codigoOperacion: string;
    comprobanteId: number;
    comprobante: string;
    cliente: string | null;
    total: number | null;
    accionFiscal: 'baja' | 'notacredito';
    codigoTipoNota: string | null;
    motivo: string;
    reemitir: boolean;
    /** 0 solicitada, 1 aprobada, 2 rechazada. */
    estado: number;
    fechaSolicitud: string;
    solicitadaPor: string | null;
    fechaAprobacion: string | null;
    aprobadaPor: string | null;
    fechaRechazo: string | null;
    motivoRechazo: string | null;
    observaciones: string | null;
}

export interface ResumenSunat {
    id: number;
    tipo: string;
    identificador: string;
    fechaReferencia: string;
    fechaGeneracion: string;
    estado: string;
    ticket: string | null;
    codigoRespuesta: string | null;
    mensaje: string | null;
    ambiente: number;
    sentAt: string | null;
    confirmedAt: string | null;
    documentos: string[];
    tieneXml: boolean;
    tieneCdr: boolean;
}

export interface FiltroComprobantes {
    desde?: string | null;
    hasta?: string | null;
    estado?: number | null;
    tipo?: number | null;
    texto?: string | null;
    page: number;
    recordsByPage: number;
}

export interface Mensaje { mensaje: string; }

// SIRE (Registro de Ventas)

export interface PeriodoSire {
    id: number;
    periodo: string;
    estado: string;
    desEstadoSunat: string | null;
    fechaPropuesta: string | null;
    fechaConciliacion: string | null;
    totalLineas: number;
    totalMonto: number;
    cntCoinciden: number;
    cntDifieren: number;
    cntSoloSunat: number;
    cntSoloSistema: number;
    aceptadaAt: string | null;
    aceptadaPor: string | null;
    procesoEnCurso: { id: number; operacion: string; ticket: string; estado: string } | null;
}

export interface LineaSire {
    id: number;
    origen: string;
    /** 1 coinciden, 2 difieren, 3 solo en SUNAT, 4 solo en el sistema. */
    cubeta: number;
    tipoDoc: string;
    serie: string;
    numero: string;
    fechaEmision: string | null;
    clienteDocNumero: string | null;
    clienteNombre: string | null;
    total: number;
    moneda: string | null;
    comprobanteId: number | null;
    diferenciaDetalle: string | null;
}

/** Todo lo de api/fiscal. Los errores llegan como texto legible: la pantalla los muestra tal cual. */
@Injectable({ providedIn: 'root' })
export class FiscalService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/fiscal`;

    // Configuración
    config(): Observable<ConfigFiscal> {
        return this.http.get<ConfigFiscal>(`${this.baseUrl}/config`);
    }
    guardarConfig(dto: { ambiente: number; modoBoletas: number; ubigeo: string | null }): Observable<ConfigFiscal> {
        return this.http.put<ConfigFiscal>(`${this.baseUrl}/config`, dto);
    }
    certificados(): Observable<CertificadoFiscal[]> {
        return this.http.get<CertificadoFiscal[]>(`${this.baseUrl}/config/certificados`);
    }
    subirCertificado(archivo: File, password: string, alias: string): Observable<CertificadoFiscal> {
        const form = new FormData();
        form.append('archivo', archivo);
        form.append('password', password ?? '');
        form.append('alias', alias ?? '');
        return this.http.post<CertificadoFiscal>(`${this.baseUrl}/config/certificado`, form);
    }
    guardarSol(usuario: string, clave: string): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/config/sol`, { usuario, clave });
    }
    guardarCredenciales(valores: Record<string, string>): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/config/credenciales`, valores);
    }
    probarBeta(): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/config/probar-beta`, {});
    }

    // Bandeja
    resumen(): Observable<ResumenFiscal> {
        return this.http.get<ResumenFiscal>(`${this.baseUrl}/resumen`);
    }
    comprobantes(f: FiltroComprobantes): Observable<HttpResponse<Comprobante[]>> {
        let params = new HttpParams().set('Page', f.page).set('RecordsByPage', f.recordsByPage);
        if (f.desde) params = params.set('Desde', f.desde);
        if (f.hasta) params = params.set('Hasta', f.hasta);
        if (f.estado != null) params = params.set('Estado', f.estado);
        if (f.tipo != null) params = params.set('Tipo', f.tipo);
        if (f.texto) params = params.set('Texto', f.texto);
        return this.http.get<Comprobante[]>(`${this.baseUrl}/comprobantes`, { params, observe: 'response' });
    }
    historial(id: number): Observable<EntradaHistorial[]> {
        return this.http.get<EntradaHistorial[]>(`${this.baseUrl}/comprobantes/${id}/historial`);
    }
    pdf(id: number, formato: 'A4' | 'A5' | 'Ticket' = 'A4'): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/comprobantes/${id}/pdf`, { params: { formato }, responseType: 'blob' });
    }
    xml(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/comprobantes/${id}/xml`, { responseType: 'blob' });
    }
    cdr(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/comprobantes/${id}/cdr`, { responseType: 'blob' });
    }
    /** PDF del comprobante vigente de una operación (equipo o el propio cliente). */
    pdfDeOperacion(operationId: number, formato: 'A4' | 'Ticket' = 'A4'): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/operaciones/${operationId}/comprobante.pdf`, { params: { formato }, responseType: 'blob' });
    }

    enviar(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/comprobantes/${id}/enviar`, {});
    }
    reemitir(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/comprobantes/${id}/reemitir`, {});
    }
    declararResumen(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/comprobantes/${id}/declarar-resumen`, {});
    }
    verificarBaja(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/comprobantes/${id}/verificar-baja`, {});
    }

    // Por facturar
    porFacturar(page: number, recordsByPage: number): Observable<HttpResponse<OperacionPorFacturar[]>> {
        const params = new HttpParams().set('Page', page).set('RecordsByPage', recordsByPage);
        return this.http.get<OperacionPorFacturar[]>(`${this.baseUrl}/operaciones-por-facturar`, { params, observe: 'response' });
    }
    emitir(operationId: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/operaciones/${operationId}/emitir`, {});
    }

    // Anulaciones
    motivosNotaCredito(): Observable<{ codigo: string; descripcion: string }[]> {
        return this.http.get<{ codigo: string; descripcion: string }[]>(`${this.baseUrl}/motivos-nota-credito`);
    }
    solicitarAnulacion(dto: { comprobanteId: number; accion: string; codigoTipoNota: string | null; motivo: string; reemitir: boolean }): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/anulaciones`, dto);
    }
    anulaciones(estado: number | null): Observable<SolicitudAnulacion[]> {
        let params = new HttpParams();
        if (estado != null) params = params.set('estado', estado);
        return this.http.get<SolicitudAnulacion[]>(`${this.baseUrl}/anulaciones`, { params });
    }
    aprobarAnulacion(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/anulaciones/${id}/aprobar`, {});
    }
    rechazarAnulacion(id: number, motivo: string): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/anulaciones/${id}/rechazar`, { motivo });
    }

    // Resúmenes
    resumenes(page: number, recordsByPage: number): Observable<HttpResponse<ResumenSunat[]>> {
        const params = new HttpParams().set('Page', page).set('RecordsByPage', recordsByPage);
        return this.http.get<ResumenSunat[]>(`${this.baseUrl}/resumenes`, { params, observe: 'response' });
    }
    enviarResumenes(): Observable<{ mensajes: string[] }> {
        return this.http.post<{ mensajes: string[] }>(`${this.baseUrl}/resumenes/enviar`, {});
    }
    consultarResumen(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/resumenes/${id}/consultar`, {});
    }
    archivoResumen(id: number, archivo: 'xml' | 'cdr'): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/resumenes/${id}/${archivo}`, { responseType: 'blob' });
    }

    // SIRE
    sireEstado(): Observable<{ configurado: boolean }> {
        return this.http.get<{ configurado: boolean }>(`${this.baseUrl}/sire/estado`);
    }
    sireProbar(): Observable<{ ok: boolean; mensaje: string; periodos: number }> {
        return this.http.post<{ ok: boolean; mensaje: string; periodos: number }>(`${this.baseUrl}/sire/probar`, {});
    }
    sireSincronizar(): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/sire/sincronizar`, {});
    }
    sirePeriodos(): Observable<PeriodoSire[]> {
        return this.http.get<PeriodoSire[]>(`${this.baseUrl}/sire/periodos`);
    }
    sirePedirPropuesta(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/sire/periodos/${id}/propuesta`, {});
    }
    sireConsultar(procesoId: number): Observable<Mensaje & { terminado: boolean }> {
        return this.http.post<Mensaje & { terminado: boolean }>(`${this.baseUrl}/sire/procesos/${procesoId}/consultar`, {});
    }
    sireConciliar(id: number): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/sire/periodos/${id}/conciliar`, {});
    }
    sireLineas(id: number, cubeta: number | null, page: number, recordsByPage: number): Observable<HttpResponse<LineaSire[]>> {
        let params = new HttpParams().set('Page', page).set('RecordsByPage', recordsByPage);
        if (cubeta != null) params = params.set('Cubeta', cubeta);
        return this.http.get<LineaSire[]>(`${this.baseUrl}/sire/periodos/${id}/lineas`, { params, observe: 'response' });
    }
    sireAceptar(id: number, confirmarDiferencias: boolean): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${this.baseUrl}/sire/periodos/${id}/aceptar`, { confirmarDiferencias });
    }
}
