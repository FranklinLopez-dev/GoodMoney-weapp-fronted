import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Configuración

export interface ConfiguracionCumplimiento {
    id: number;
    roUmbralIndividualUsd: number;
    roUmbralAcumuladoMensualUsd: number;
    roUbigeoOficina: string | null;
    roDiasHabilesRemision: number;
    alertaVentanaDias: number;
    alertaMinOperaciones: number;
    alertaPorcentajeCercania: number;
    pesoPep: number;
    pesoFamiliarPep: number;
    pesoOcupacionRiesgo: number;
    pesoZonaRiesgo: number;
    pesoVolumenAlto: number;
    pesoAlertaInusual: number;
    pesoListaNegra: number;
    pesoDatosDesactualizados: number;
    pesoCoincidenciaListas: number;
    pesoRespaldoPendiente: number;
    pesoIdentificacionPendiente: number;
    umbralAmbar: number;
    umbralRojo: number;
    mesesActualizacionDatos: number;
    exigirDeclaracionPep: boolean;
    pepVigenciaDias: number;
    /** Exigir KYC validado para cotizar y registrar (apagado por defecto). */
    kycExigirParaOperar: boolean;
    /** Validar sola a quien cumple todas las reglas. */
    kycAutoValidar: boolean;
    kycVigenciaMeses: number;
    ocupacionesRiesgoCodigos: string | null;
    ubigeosRiesgo: string | null;
    paisesRiesgo: string | null;
    updatedAt: string | null;
}

// Portada

export interface MesPendiente {
    year: number;
    month: number;
    status: string;
    filas: number;
    fechaLimite: string;
    diasParaVencer: number;
    vencido: boolean;
}

export interface ResumenCumplimiento {
    alertasPendientes: number;
    alertasAltas: number;
    rosAbiertos: number;
    rosPorRemitir: number;
    personasSinDocumento: number;
    respaldosPendientes: number;
    roMesFilas: number;
    roMesIncompletas: number;
    roMesEstado: string;
    mesesPendientes: MesPendiente[];
}

// Alertas

export interface Alerta {
    id: number;
    personId: number;
    documentNumber: string;
    fullName: string;
    personType: string;
    ruleType: string;
    severity: string;
    accumulatedAmountUsd: number;
    operationsCount: number;
    windowDays: number;
    periodStart: string;
    periodEnd: string;
    status: string;
    reviewedBy: string | null;
    reviewDate: string | null;
    reviewNote: string | null;
    dateCreation: string;
    hasSuspiciousReport: boolean;
}

export interface OperacionDeAlerta {
    id: number;
    dateCreation: string;
    typeOperation: string;
    montoUsd: number;
    tipoCambio: number;
    totalPen: number;
    codeOperation: string | null;
    isRecordedForSBS: boolean;
    porCuentaDeTerceros: boolean;
}

export interface FactorRiesgo {
    etiqueta: string;
    puntos: number;
    aplica: boolean;
    detalle: string | null;
}

export interface RiesgoPersona {
    personId: number;
    fullName: string;
    documentNumber: string;
    score: number;
    level: string;
    isBlackListed: boolean;
    blackListReason: string | null;
    hasAlert: boolean;
    alertRuleType: string | null;
    alertStatus: string | null;
    accumulatedAmountUsd: number;
    operationsCount: number;
    windowDays: number;
    pendingIdentification: boolean;
    pendingSupport: boolean;
    dataUpdatedAt: string | null;
    dataOutdated: boolean;
    updateMonths: number;
    factors: FactorRiesgo[];
    /** Coincidencias con ONU/OFAC/UE no descartadas y con las listas propias LAFT, legibles. */
    coincidenciasListas?: string[];
    /** Figura en la lista PEP propia del oficial. */
    enListaPep?: boolean;
    /** Régimen de debida diligencia: 'General' | 'Reforzado'. */
    regimen?: string;
    /** Riesgo LAFT normativo: 'Bajo' | 'Medio' | 'Alto'. */
    riesgoLaft?: string;
    motivosRegimen?: { etiqueta: string; riesgo: string; detalle: string | null }[];
}

// Bitácora

export interface EntradaBitacora {
    id: number;
    type: string;
    text: string | null;
    originalName: string | null;
    bytes: number;
    hasFile: boolean;
    createdByName: string | null;
    createdAt: string;
}

// Registro de Operaciones

export interface FilaRo {
    operationId: number;
    fecha: string;
    comprobante: string | null;
    typeOperation: string;
    ejecutantePersonId: number | null;
    ejecutanteDocumento: string | null;
    ejecutanteNombre: string | null;
    porCuentaDeTerceros: boolean;
    beneficiarioPersonId: number | null;
    beneficiarioDocumento: string | null;
    beneficiarioNombre: string | null;
    montoUsd: number;
    totalPen: number;
    origenFondos: string | null;
    ocupacion: string | null;
    nacionalidad: string | null;
    faltantes: string[];
    /** Entró por el acumulado sin llegar al umbral individual: no va al archivo del portal. */
    esMultiple?: boolean;
    /** Tiene declaración jurada: la suya o la del mes de la persona (acumulado). */
    tieneDj?: boolean;
}

export interface CatalogoItem {
    id: number;
    code: string;
    description: string;
}

export interface RoMensual {
    year: number;
    month: number;
    status: string;
    exportedAt: string | null;
    sentAt: string | null;
    note: string | null;
    fechaLimite: string | null;
    diasParaVencer: number | null;
    vencido: boolean;
    totalFilas: number;
    filasIncompletas: number;
    totalUsd: number;
    filasPortal?: number;
    filasMultiples?: number;
    umbralIndividualUsd?: number;
    rows: FilaRo[];
    ocupaciones: CatalogoItem[];
}

export interface InformeRo {
    year: number;
    month: number;
    personas: number;
    marcadas: number;
    desmarcadas: number;
    enElRo: number;
    mesCongelado: boolean;
}

// ROS

export interface Expediente {
    id: number;
    personId: number;
    documentNumber: string;
    fullName: string;
    status: string;
    detectedAt: string;
    qualifiedAt: string | null;
    sentAt: string | null;
    uifCode: string | null;
    analysis: string | null;
    signals: string | null;
    complianceAlertId: number | null;
    horasParaRemitir: number | null;
}

// Exclusiones del registro

export interface Exclusion {
    id: number;
    personId: number;
    documentNumber: string;
    fullName: string;
    reason: string;
    type: string;
    active: boolean;
    createdAt: string;
    deactivatedAt: string | null;
    operacionesAfectadas: number;
}

// Listas restrictivas

export interface EstadoLista {
    listSource: string;
    entries: number;
    lastImport: string | null;
    lastStatus: string | null;
    lastError: string | null;
    diasDesdeUltimaOk: number | null;
}

export interface CoincidenciaLista {
    screeningEntryId: number;
    listSource: string;
    fullName: string;
    entityType: string;
    programs: string | null;
    country: string | null;
    score: number;
    matchType: string;
}

export interface Coincidencia {
    id: number;
    personId: number;
    documentNumber: string;
    fullName: string;
    screeningEntryId: number;
    listSource: string;
    listName: string;
    entityType: string;
    programs: string | null;
    country: string | null;
    score: number;
    matchType: string;
    status: string;
    reviewNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
    lastSeenAt: string | null;
    /** La entrada salió de la lista oficial; la revisión se conserva. */
    entradaRetirada?: boolean;
    /** Último análisis con IA: una opinión, no una revisión. */
    iaVeredicto: 'FalsoPositivo' | 'PosibleCoincidencia' | 'CoincidenciaProbable' | null;
    iaConfianza: number | null;
    iaAnalisis: string | null;
    iaModelo: string | null;
    iaFecha: string | null;
}

export interface EstadoIa {
    operativa: boolean;
    restantesHoy: number;
    topeDiario: number;
}

export interface AnalisisIa {
    hitId: number;
    veredicto: Coincidencia['iaVeredicto'];
    confianza: number | null;
    analisis: string;
    modelo: string;
    fecha: string;
    restantesHoy: number;
}

/** Módulo PLAFT. Todo se agrega por persona y no por perfil ni por cuenta: así se ve el fraccionamiento. */
/** Listas propias del oficial de cumplimiento. */
export type TipoListaPropia = 'PEP' | 'NoticiasLaft' | 'RelacionadosLaft' | 'OFAC';

export interface ListaPropiaResumen {
    tipoLista: TipoListaPropia;
    nombre: string;
    activas: number;
    dadasDeBaja: number;
    ultimoPeriodo: string | null;
    ultimaCarga: string | null;
}

export interface ListaPropiaEntrada {
    id: number;
    tipoLista: TipoListaPropia;
    tipoDocumento: string | null;
    numberDocument: string | null;
    nombreCompleto: string | null;
    cargo: string | null;
    entidad: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    delito: string | null;
    periodoInformativo: string | null;
    observacion: string | null;
    activo: boolean;
    createdAt: string;
    motivoEliminacion: string | null;
    eliminadoAt: string | null;
    eliminadoPor: string | null;
}

export interface FilaListaPropia {
    tipoDocumento?: string | null;
    numberDocument?: string | null;
    nombreCompleto?: string | null;
    cargo?: string | null;
    entidad?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    delito?: string | null;
    periodoInformativo?: string | null;
    observacion?: string | null;
}

export interface ResultadoCargaLista {
    leidas: number;
    importadas: number;
    actualizadas: number;
    descartadas: number;
    dadasDeBaja: number;
    sinDocumento: number;
    avisos: string[];
}

export interface FilaRevisionLaft {
    operationId: number;
    codigo: string;
    fecha: string;
    tipo: string;
    montoUsd: number;
    tipoCambio: number;
    totalPen: number;
    comprobante: string | null;
    personId: number;
    cliente: string;
    tipoDocumento: string | null;
    documento: string | null;
    nacionalidad: string | null;
    ocupacion: string | null;
    ubigeo: string | null;
    regimen: string;
    riesgoLaft: string;
    motivoRegimen: string;
    /** Quien dio la orden si opera por cuenta de otro (titular de la cuenta); null si es el mismo. */
    ejecutante: string | null;
    ejecutanteDocumento: string | null;
    ejecutanteRegimen: string | null;
    ejecutanteMotivoRegimen: string | null;
    motivosInusual: string[];
    esInusual: boolean;
}

export interface RevisionLaft {
    desde: string;
    hasta: string;
    umbralUsd: number;
    operaciones: number;
    sinIdentificar: number;
    inusuales: number;
    clientesReforzado: number;
    filas: FilaRevisionLaft[];
}

export interface OperacionMultiple {
    operationId: number;
    fecha: string;
    tipo: string;
    montoUsd: number;
    totalPen: number;
    comprobante: string | null;
    origenFondos: string | null;
    ejecutante: string | null;
    /** Llega sola al umbral individual: va al portal, se muestra solo de contexto. */
    individual: boolean;
}

export interface CasoMultiple {
    caseId: number | null;
    personId: number;
    nombre: string;
    documento: string | null;
    operaciones: number;
    totalUsd: number;
    operacionesMes: number;
    totalUsdMes: number;
    /** Hay análisis guardado pero las operaciones ya no califican (exclusión, cancelación, otro umbral). */
    yaNoCalifica: boolean;
    estado: 'Pendiente' | 'Revisado' | 'ElevadoARos';
    origenFondos: string | null;
    sustento: string | null;
    conclusion: string | null;
    descartado: boolean;
    descarteMotivo: string | null;
    revisadoPor: string | null;
    revisadoAt: string | null;
    entradasBitacora: number;
    detalle: OperacionMultiple[];
}

export interface MultiplesMes {
    year: number;
    month: number;
    umbralIndividualUsd: number;
    umbralAcumuladoUsd: number;
    pendientes: number;
    casos: CasoMultiple[];
}

/** Un mes del IAOC. Los números del ROS llegan null a quien no tiene compliance.ros. */
export interface IaocMes {
    mes: number;
    cerrado: boolean;
    operacionesRo: number;
    montoRoUsd: number;
    operacionesMultiples: number;
    montoMultiplesUsd: number;
    personasMultiples: number;
    alertasInusuales: number;
    coincidenciasConfirmadas: number;
    rosAbiertos: number | null;
    rosRemitidos: number | null;
    /** Pendiente | Exportado | Enviado, o null si el mes no tenía nada que remitir. */
    estadoRo: string | null;
    roEnviadoAt: string | null;
    roFechaLimite: string | null;
    roEnPlazo: boolean | null;
    /** Sin enviar y con el plazo vencido (lo calcula el servidor: el último día todavía vale). */
    roVencido: boolean;
}

export interface Iaoc {
    year: number;
    umbralIndividualUsd: number;
    umbralAcumuladoUsd: number;
    incluyeRos: boolean;
    meses: IaocMes[];
    totales: IaocMes;
}

@Injectable({ providedIn: 'root' })
export class ComplianceService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/compliance`;

    // configuración

    configuracion(): Observable<ConfiguracionCumplimiento> {
        return this.http.get<ConfiguracionCumplimiento>(`${this.baseUrl}/configuracion`);
    }

    guardarConfiguracion(cfg: ConfiguracionCumplimiento): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/configuracion`, cfg);
    }

    // portada

    resumen(): Observable<ResumenCumplimiento> {
        return this.http.get<ResumenCumplimiento>(`${this.baseUrl}/resumen`);
    }

    // alertas

    alertas(filtro: { estado?: string; regla?: string; severidad?: string; valor?: string; }): Observable<Alerta[]> {
        let params = new HttpParams().set('Page', 1).set('RecordsByPage', 100);
        if (filtro.estado) params = params.set('estado', filtro.estado);
        if (filtro.regla) params = params.set('regla', filtro.regla);
        if (filtro.severidad) params = params.set('severidad', filtro.severidad);
        if (filtro.valor) params = params.set('valor', filtro.valor);
        return this.http.get<Alerta[]>(`${this.baseUrl}/alertas`, { params });
    }

    operacionesDeAlerta(id: number): Observable<OperacionDeAlerta[]> {
        return this.http.get<OperacionDeAlerta[]>(`${this.baseUrl}/alertas/${id}/operaciones`);
    }

    revisarAlerta(id: number, status: string, reviewNote: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/alertas/revisar`, { id, status, reviewNote });
    }

    recalcularAlertas(): Observable<{ personas: number }> {
        return this.http.post<{ personas: number }>(`${this.baseUrl}/alertas/recalcular`, {});
    }

    riesgo(personId: number): Observable<RiesgoPersona> {
        return this.http.get<RiesgoPersona>(`${this.baseUrl}/riesgo/${personId}`);
    }

    // bitácora

    bitacora(opciones: { alertaId?: number; rosId?: number; multipleId?: number }): Observable<EntradaBitacora[]> {
        let params = new HttpParams();
        if (opciones.alertaId) params = params.set('alertaId', opciones.alertaId);
        if (opciones.rosId) params = params.set('rosId', opciones.rosId);
        if (opciones.multipleId) params = params.set('multipleId', opciones.multipleId);
        return this.http.get<EntradaBitacora[]>(`${this.baseUrl}/bitacora`, { params });
    }

    agregarBitacora(entrada: {
        complianceAlertId?: number; suspiciousReportId?: number; roMultipleCaseId?: number;
        text?: string; fileBase64?: string; fileName?: string;
    }): Observable<EntradaBitacora> {
        return this.http.post<EntradaBitacora>(`${this.baseUrl}/bitacora`, entrada);
    }

    /** La evidencia no cuelga de una URL pública: se pide autenticada y por id. */
    archivoBitacora(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/bitacora/${id}/archivo`, { responseType: 'blob' });
    }

    // Registro de Operaciones

    ro(year: number, month: number): Observable<RoMensual> {
        return this.http.get<RoMensual>(`${this.baseUrl}/ro/${year}/${month}`);
    }

    completarFilaRo(datos: {
        operationId: number; origenFondos?: string; positionId?: number; nacionalidad?: string;
    }): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/ro/completar`, datos);
    }

    estadoRo(year: number, month: number, status: string, note?: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/ro/estado`, { year, month, status, note });
    }

    recalcularRo(year: number, month: number): Observable<InformeRo> {
        return this.http.post<InformeRo>(`${this.baseUrl}/ro/${year}/${month}/recalcular`, {});
    }

    excelRo(year: number, month: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/ro/${year}/${month}/excel`, { responseType: 'blob' });
    }

    // expedientes ROS

    expedientes(filtro: { estado?: string; valor?: string }): Observable<Expediente[]> {
        let params = new HttpParams().set('Page', 1).set('RecordsByPage', 100);
        if (filtro.estado) params = params.set('estado', filtro.estado);
        if (filtro.valor) params = params.set('valor', filtro.valor);
        return this.http.get<Expediente[]>(`${this.baseUrl}/ros`, { params });
    }

    abrirExpediente(datos: {
        personId: number; complianceAlertId?: number; analysis?: string; signals?: string;
    }): Observable<Expediente> {
        return this.http.post<Expediente>(`${this.baseUrl}/ros`, datos);
    }

    actualizarExpediente(datos: {
        id: number; status: string; analysis?: string; signals?: string; uifCode?: string;
    }): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/ros`, datos);
    }

    /** El expediente en PDF (lo guardado, no lo que esté a medio escribir en pantalla). */
    expedientePdf(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/ros/${id}/pdf`, { responseType: 'blob' });
    }

    // IAOC

    iaoc(year: number): Observable<Iaoc> {
        return this.http.get<Iaoc>(`${this.baseUrl}/iaoc/${year}`);
    }

    iaocExcel(year: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/iaoc/${year}/excel`, { responseType: 'blob' });
    }

    // exclusiones del registro

    exclusiones(activas?: boolean): Observable<Exclusion[]> {
        let params = new HttpParams();
        if (activas != null) params = params.set('activas', activas);
        return this.http.get<Exclusion[]>(`${this.baseUrl}/exclusiones`, { params });
    }

    excluir(datos: { personId: number; reason: string; type: string }): Observable<Exclusion> {
        return this.http.post<Exclusion>(`${this.baseUrl}/exclusiones`, datos);
    }

    /** Desactiva, no borra: el histórico de por qué estuvo excluida es del expediente. */
    desactivarExclusion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/exclusiones/${id}`);
    }

    // listas restrictivas

    estadoListas(): Observable<EstadoLista[]> {
        return this.http.get<EstadoLista[]>(`${this.baseUrl}/screening/estado`);
    }

    actualizarListas(): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.baseUrl}/screening/actualizar`, {});
    }

    consultarListas(nombre: string, documento: string): Observable<CoincidenciaLista[]> {
        const params = new HttpParams().set('nombre', nombre ?? '').set('documento', documento ?? '');
        return this.http.get<CoincidenciaLista[]>(`${this.baseUrl}/screening/consultar`, { params });
    }

    coincidencias(filtro: { estado?: string; fuente?: string; valor?: string }): Observable<Coincidencia[]> {
        let params = new HttpParams();
        if (filtro.estado) params = params.set('estado', filtro.estado);
        if (filtro.fuente) params = params.set('fuente', filtro.fuente);
        if (filtro.valor) params = params.set('valor', filtro.valor);
        return this.http.get<Coincidencia[]>(`${this.baseUrl}/screening/coincidencias`, { params });
    }

    estadoIa(): Observable<EstadoIa> {
        return this.http.get<EstadoIa>(`${this.baseUrl}/screening/ia`);
    }

    /** Opinión de la IA sobre la coincidencia. Gasta una consulta del tope diario. */
    analizarCoincidenciaIa(id: number): Observable<AnalisisIa> {
        return this.http.post<AnalisisIa>(`${this.baseUrl}/screening/coincidencias/${id}/analizar-ia`, {});
    }

    /** `listaNegra`: qué pasó con la lista negra al confirmar o revertir (null si nada). */
    revisarCoincidencia(id: number, status: string, reviewNote: string): Observable<{ listaNegra: string | null }> {
        return this.http.put<{ listaNegra: string | null }>(`${this.baseUrl}/screening/coincidencias/revisar`, { id, status, reviewNote });
    }

    // listas propias

    listasPropiasResumen(): Observable<ListaPropiaResumen[]> {
        return this.http.get<ListaPropiaResumen[]>(`${this.baseUrl}/listas-propias/resumen`);
    }

    listaPropia(tipo: TipoListaPropia, filtro: { buscar?: string; activas?: boolean | null; pagina: number; tamano: number }): Observable<HttpResponse<ListaPropiaEntrada[]>> {
        let params = new HttpParams().set('Page', filtro.pagina).set('RecordsByPage', filtro.tamano);
        if (filtro.buscar) params = params.set('buscar', filtro.buscar);
        if (filtro.activas !== null && filtro.activas !== undefined) params = params.set('activas', filtro.activas);
        else params = params.set('activas', '');
        return this.http.get<ListaPropiaEntrada[]>(`${this.baseUrl}/listas-propias/${tipo}`, { params, observe: 'response' });
    }

    importarListaPropia(tipo: TipoListaPropia, fileBase64: string, reemplazar: boolean, motivo: string | null): Observable<ResultadoCargaLista> {
        return this.http.post<ResultadoCargaLista>(`${this.baseUrl}/listas-propias/${tipo}/importar`, { fileBase64, reemplazar, motivo });
    }

    agregarAListaPropia(tipo: TipoListaPropia, fila: FilaListaPropia): Observable<ResultadoCargaLista> {
        return this.http.post<ResultadoCargaLista>(`${this.baseUrl}/listas-propias/${tipo}`, fila);
    }

    darDeBajaListaPropia(id: number, motivo: string): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/listas-propias/${id}/baja`, { motivo });
    }

    reactivarListaPropia(id: number): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/listas-propias/${id}/reactivar`, {});
    }

    /** `activas`: true la lista vigente, false las dadas de baja, null todo el histórico. */
    exportarListaPropia(tipo: TipoListaPropia, activas: boolean | null): Observable<Blob> {
        const params = new HttpParams().set('activas', activas === null ? '' : String(activas));
        return this.http.get(`${this.baseUrl}/listas-propias/${tipo}/exportar`, { params, responseType: 'blob' });
    }

    plantillaListaPropia(tipo: TipoListaPropia): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/listas-propias/${tipo}/plantilla`, { responseType: 'blob' });
    }

    // revisión mensual LAFT

    revisionLaft(desde: string, hasta: string, soloInusuales: boolean): Observable<RevisionLaft> {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta).set('soloInusuales', soloInusuales);
        return this.http.get<RevisionLaft>(`${this.baseUrl}/revision-laft`, { params });
    }

    revisionLaftExcel(desde: string, hasta: string, soloInusuales: boolean): Observable<Blob> {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta).set('soloInusuales', soloInusuales);
        return this.http.get(`${this.baseUrl}/revision-laft/excel`, { params, responseType: 'blob' });
    }

    // operaciones múltiples

    multiples(year: number, month: number): Observable<MultiplesMes> {
        return this.http.get<MultiplesMes>(`${this.baseUrl}/ro-multiples/${year}/${month}`);
    }

    revisarMultiple(dto: {
        year: number; month: number; personId: number;
        origenFondos: string | null; sustento: string | null; conclusion: string | null; estado: string;
    }): Observable<{ caseId: number }> {
        return this.http.put<{ caseId: number }>(`${this.baseUrl}/ro-multiples/revision`, dto);
    }

    descartarMultiple(dto: { year: number; month: number; personId: number; descartar: boolean; motivo: string | null }): Observable<{ caseId: number }> {
        return this.http.put<{ caseId: number }>(`${this.baseUrl}/ro-multiples/descartar`, dto);
    }

    /** Crea el caso sin tocar el análisis: para colgarle bitácora antes del primer análisis. */
    abrirMultiple(dto: { year: number; month: number; personId: number }): Observable<{ caseId: number }> {
        return this.http.put<{ caseId: number }>(`${this.baseUrl}/ro-multiples/abrir`, dto);
    }

    excelMultiples(year: number, month: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/ro-multiples/${year}/${month}/excel`, { responseType: 'blob' });
    }

    /** La declaración jurada SBS de una operación (la suya o la del mes que la cubre). */
    djOperacion(operationId: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/operaciones/${operationId}/dj`, { responseType: 'blob' });
    }

    /** Manda al cliente el enlace para firmar la declaración jurada de una operación que no la tiene. */
    pedirDj(operationId: number): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.baseUrl}/operaciones/${operationId}/dj/enlace`, {});
    }
}
