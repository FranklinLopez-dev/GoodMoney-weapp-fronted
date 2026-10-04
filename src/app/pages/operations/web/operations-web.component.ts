import { VoucherViewerService } from 'src/app/pages/operations/voucher-viewer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FiscalService } from '../../fiscal/fiscal.service';
import { descargarArchivo, mostrarErrorFiscal } from '../../fiscal/fiscal-comunes';
import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, DestroyRef, inject, Input, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { finalize, lastValueFrom, switchMap } from 'rxjs';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Router, RouterModule } from '@angular/router';
import { OperationsService } from '../operations.service';
import { OperationsWebStore } from './operations-web.store';
import { Operation, OperationBanks, OperationDTO } from 'src/app/core/models/operations/operations.model';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { environment } from 'src/environments/environment';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { MatDialog } from '@angular/material/dialog';
import { TransferOperationComponent } from '../list/transfer/transfer.component';
import { SentComponent } from './sent/sent.component';
import { ReceivedComponent } from './received/received.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { OperationTimelineComponent } from './operation-timeline/operation-timeline.component';
import { SocketService } from 'src/app/services/socket.service';
import { OperationsRealtimeService } from '../operations-realtime.service';
import { ESTADOS_KYC } from '../../persons/kyc/kyc.service';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

const EMPTY_OPERATION_DTO: OperationDTO = {
    operations: [],
    registradas: 0,
    proceso: 0,
    finalizadas: 0,
    canceladas: 0
};

@Component({
    selector: 'app-operations-web',
    standalone: true,
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        RouterModule,
        DateMaskDirective,
        FallbackImgDirective,
        OperationTimelineComponent
    ],
    templateUrl: './operations-web.component.html',
    styleUrls: ['./operations-web.component.scss']
})
export class OperationsWebComponent implements OnInit {
    readonly vouchers = inject(VoucherViewerService);

    @Input() mode: 'default' | 'traceability' = 'default';
    @ViewChild('timelineTpl', { static: true })
    timelineTpl!: TemplateRef<any>;

    private service = inject(OperationsService);
    private router = inject(Router);
    readonly layout = inject(FullComponent);
    protected store = inject(OperationsWebStore);
    private realtime = inject(OperationsRealtimeService);
    private toastr = inject(ToastrService);
    private fiscal = inject(FiscalService);
    private fb = inject(FormBuilder);
    public readonly baseUrl = environment.apiUrl;
    public authStore = inject(AuthStore);
    private dialog = inject(MatDialog);
    private socket = inject(SocketService);
    public operation: Operation = {} as Operation;

    displayedColumns: string[] = [];
    private readonly BASE_COLUMNS = [
        "id",
        "operation",
        "cliente",
        "whatsapp",
        "fecha",
        "envia",
        "recibe",
        "tc",
        "cupon",
    ];

    private readonly TRACE_COLUMN = "trace";

    dataSource = new MatTableDataSource<Operation>();
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());
    private destroyRef = inject(DestroyRef);

    registradas = signal(0);
    procesadas = signal(0);
    finalizadas = signal(0);
    canceladas = signal(0);

    /**
     * Reloj de la bandeja: los minutos los manda el servidor (con su reloj, no el
     * del navegador); aquí solo se suma lo transcurrido desde que llegaron,
     * repintando cada 30 s sin volver a consultar.
     */
    readonly ahora = signal(Date.now());
    private cargadoEn = Date.now();
    private readonly transcurrido = computed(() => Math.max(0, Math.floor((this.ahora() - this.cargadoEn) / 60_000)));
    readonly estadosKyc = ESTADOS_KYC;
    /** Espera de la operación en proceso más antigua de toda la bandeja. */
    readonly esperaMasLarga = computed(() => {
        const m = this.store.items()?.procesoEsperaMinutos;
        return m == null ? null : m + this.transcurrido();
    });

    form = this.fb.nonNullable.group({
        startDate: [new Date(), Validators.required],
        endDate: [new Date(), Validators.required],
        type: ["0", Validators.required],
        status: ["2", Validators.required],
        searchTerm: [""]
    },
        {
            validators: [
                rangeValidator('startDate', 'endDate', 'date')
            ]
        }
    );

    ngOnInit(): void {
        this.updateDataSource();
        this.buildColumns();

        // La guarda evita un toast de fechas incompletas por cada pausa de tipeo.
        this.form.controls.searchTerm.valueChanges
            .pipe(conPausaDeTipeo(), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => { if (this.form.valid) this.cargarData(); });

        const reloj = setInterval(() => this.ahora.set(Date.now()), 30_000);
        this.destroyRef.onDestroy(() => clearInterval(reloj));

        this.socket.start();

        this.socket.on<string>('AddNewOperation', (message) => {
            this.addOperation(message);
        });
        // Otro operador finalizó o canceló: la cola de pendientes también cambia.
        this.socket.on<string>('RemoveNewOperation', (message) => {
            this.addOperation(message);
        });
    }

    get control() {
        return this.form.controls;
    }

    /** Llegó o cambió una operación: se recarga si se está mirando lo pendiente. */
    addOperation(msg: any): void {
        const status = this.form.value.status;
        if (msg === 'OK' && (status === '1' || status === '2') && this.form.valid) {
            this.cargarData();
        }
    }

    /** "12 min", "1 h 05 min", "2 d 3 h". */
    duracion(minutos: number): string {
        if (minutos < 60) return `${minutos} min`;
        const h = Math.floor(minutos / 60);
        if (h < 24) return `${h} h ${String(minutos % 60).padStart(2, '0')} min`;
        return `${Math.floor(h / 24)} d ${h % 24} h`;
    }

    /** En proceso: cuánto lleva esperando desde que el cliente transfirió. */
    espera(op: Operation): number | null {
        return op.status === '2' && op.esperaMinutos != null ? op.esperaMinutos + this.transcurrido() : null;
    }

    /** Más de 15 minutos pide atención; más de 30 ya es tarde. */
    nivelEspera(minutos: number): 'ok' | 'atencion' | 'tarde' {
        return minutos >= 30 ? 'tarde' : minutos >= 15 ? 'atencion' : 'ok';
    }

    /** Registrada: minutos para transferir (negativo: vencida, se cancela sola). */
    vence(op: Operation): number | null {
        return op.status === '1' && op.venceEnMinutos != null ? op.venceEnMinutos - this.transcurrido() : null;
    }

    private updateDataSource(): void {
        this.dataSource.data = this.store.items()?.operations ?? [];
        this.registradas.set(this.store.items()?.registradas ?? 0);
        this.finalizadas.set(this.store.items()?.finalizadas ?? 0);
        this.canceladas.set(this.store.items()?.canceladas ?? 0);
        this.procesadas.set(this.store.items()?.proceso ?? 0);
    }

    cargarData() {
        this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
        this.loadData();
    }

    loadData(): void {

        if (!this.form.valid) {
            this.toastr.warning('Por favor complete las fechas correctamente');
            return;
        }

        this.store.setLoading(true);

        const v = this.form.value;
        const fromDate = aFechaApi(new Date(v.startDate!));
        const toDate = aFechaApi(new Date(v.endDate!));

        this.service.searchAdmi(
            v.status!,
            v.type!,
            fromDate,
            toDate,
            this.pageIndex(),
            this.pageSize(),
            v.searchTerm ?? ''
        )
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: response => {
                    const data: OperationDTO = response.body ?? EMPTY_OPERATION_DTO;

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.cargadoEn = Date.now();
                    this.ahora.set(this.cargadoEn);
                    this.store.set(data);
                    this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    private buildColumns(): void {

        const status = this.form.value.status;
        let columns: string[] = [...this.BASE_COLUMNS];

        if (status === "2") {
            columns.push(
                "code",
                "confirmaRec",
                "confirmaEn",
                "confirmaOp",
                "cancela"
            );
        }

        if (status === "3") {
            columns.push(
                "code2",
                "correlative",
                "pdf",
                "xml"
            );
        }

        if (status === "1") {
            columns.push("confirmaTr", "cancela");
        }

        if (status === "0") {
            columns.push("correlative");
        }

        if (this.mode === 'traceability') {
            columns.push(this.TRACE_COLUMN);
        }

        this.displayedColumns = columns;
    }

    public cambiarCabezeras(): void {
        this.buildColumns();
        this.loadData();
    }

    enviarWhatsApp(operation: Operation) {
        const phone = '51' + operation.eProfileCellPhone;

        const message = encodeURIComponent(
            `Hola, ` + operation.eProfileNames + ` le saluda Good Money. 
        Queremos agradecerle por confiar en nosotros. 
        Cualquier consulta, no dude en escribirnos.`
        );

        window.open(
            `https://api.whatsapp.com/send?phone=${phone}&text=${message}`,
            '_blank',
            'noopener,noreferrer'
        );
    }

    openTransfer(operationBanks: OperationBanks[]) {
        this.dialog.open(TransferOperationComponent, {
            data: operationBanks,
            disableClose: false,
            panelClass: 'custom-dialog'
        });
    }

    confirmRec(operation: Operation): void {

        if (operation.loadingEmail1 || operation.sendEmail1) return;

        if (operation.isFirstOperation) {
            this.dialog.open(ConfirmDialogComponent, {
                disableClose: true,
                data: {
                    title: 'Primera operación del cliente',
                    message:
                        'Esta es la primera operación del cliente. ' +
                        'Antes de continuar, es recomendable validar la información del perfil.',
                    confirmText: 'Continuar',
                    cancelText: 'Validar',
                    color: 'primary'
                }
            })
                .afterClosed()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((continueFlow: boolean) => {

                    if (continueFlow === false) {
                        this.router.navigate([
                            '/security/users',
                            operation.eProfile.applicationUserId, 
                            operation.eProfile.id                  
                        ]);
                        return;
                    }

                    this.executeConfirmRec(operation);
                });

            return; 
        }

        this.executeConfirmRec(operation);
    }

    private executeConfirmRec(operation: Operation): void {

        operation.loadingEmail1 = true;

        this.service.getByIdAdmi(operation.id)
            .pipe(
                switchMap(op =>
                    this.dialog
                        .open(SentComponent, {
                            data: op,
                            disableClose: true
                        })
                        .afterClosed()
                ),
                finalize(() => {
                    operation.loadingEmail1 = false;
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (confirmed: boolean | null) => {
                    if (!confirmed) return;
                    operation.sendEmail1 = true;
                },
                error: () => {
                    this.toastr.error(
                        'No se pudo obtener la operación',
                        'Error'
                    );
                }
            });
    }

    confirmEn(operation: Operation): void {

        if (operation.loadingEmail2 || operation.sendEmail2) return;

        operation.loadingEmail2 = true;

        this.service.getByIdAdmi(operation.id)
            .pipe(
                switchMap(op =>
                    this.dialog
                        .open(ReceivedComponent, {
                            data: op,
                            disableClose: true
                        })
                        .afterClosed()
                ),
                finalize(() => {
                    operation.loadingEmail2 = false;
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (confirmed: boolean | null) => {
                    if (confirmed) {
                        operation.sendEmail2 = true;
                    }
                },
                error: () => {
                    this.toastr.error(
                        'No se pudo obtener la operación',
                        'Error'
                    );
                }
            });
    }

    confirmarTransferencia(operation: Operation): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            disableClose: true,
            data: {
                title: 'Confirmar Transferencia',
                message: "¿Seguro que deseas confirmar la transferencia de la operación SC-" +
                    operation.id.toString().padStart(8, "0") +
                    "?",
                confirmText: 'Confirmar',
                cancelText: 'Cancelar',
                color: 'primary'
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                operation.loadingConfirmar = true;

                let filtro = this.store.companyBanks()
                    .filter((x) => x.bankId == operation.profileBankClient1?.bankId)
                    .filter((x) => x.coinCode == operation.profileBankClient1?.coinId);

                if (filtro.length > 0) {
                    operation.companyBankId = filtro[0].id;
                } else {
                    filtro = this.store.companyBanks()
                        .filter((x) => x.flagInter)
                        .filter((x) => x.coinCode == operation.profileBankClient1.coinId);
                    if (filtro.length > 0) {
                        operation.companyBankId = filtro[0].id;
                    }
                }

                if (!operation.companyBankId) {
                    this.toastr.warning(
                        "No se puede confirmar esta operación, porque no hay una cuenta bancaria que se pueda asociar a esta operación",
                        "Advertencia"
                    );
                }

                this.service.updateOperationDTO(operation)
                    .pipe(
                        finalize(() => {
                            operation.loadingConfirmar = false;
                        }),
                    )
                    .subscribe({
                        next: (rs: any) => {
                            if (rs == "OK") {
                                this.realtime.addNewOperation();
                                this.filtrarData(operation.id);
                                this.toastr.success(
                                    "¡Transferencia confirmada correctamente!",
                                    "Éxito"
                                );;
                                this.procesadas.set(this.procesadas() + 1);
                                this.registradas.set(this.registradas() - 1);
                            } else {
                                this.toastr.warning(rs, "Advertencia");
                            }
                        }
                    });
            }
        });
    }

    confirmarOperation(operation: Operation): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            disableClose: true,
            data: {
                title: 'Confirmar operación',
                message: "¿Seguro que deseas confirmar la operación SC-" +
                    operation.id.toString().padStart(8, "0") +
                    "?",
                confirmText: 'Confirmar',
                cancelText: 'Cancelar',
                color: 'primary'
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                operation.loadingConfirmar = true;
                this.service.updateOperationCompleted(operation)
                    .pipe(
                        finalize(() => {
                            operation.loadingConfirmar = false;
                        }),
                    )
                    .subscribe({
                        next: (rs: any) => {
                            if (rs == "OK") {
                                this.toastr.success(
                                    "¡Operación confirmada correctamente!",
                                    "Éxito"
                                );
                            } else {
                                this.toastr.warning(rs, "Advertencia");
                            }
                            this.realtime.removeOperation();
                            this.filtrarData(operation.id);
                            this.finalizadas.set(this.finalizadas() + 1);
                            this.procesadas.set(this.procesadas() - 1);
                        }
                    });
            }
        });
    }

    cancelarOperation(operation: Operation): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            disableClose: true,
            data: {
                title: 'Cancelar operación',
                message: "¿Seguro que deseas cancelar la operación SC-" +
                    operation.id.toString().padStart(8, "0") +
                    "?",
                confirmText: 'Cancelar',
                cancelText: 'Cerrar',
                color: 'primary'
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                operation.loadingCancelar = true;
                this.service
                    .updateCancelarOperationDTO(operation)
                    .pipe(
                        finalize(() => {
                            operation.loadingCancelar = false;
                        }),
                    )
                    .subscribe({
                        next: (rs: any) => {
                            if (rs == "OK") {
                                this.realtime.removeOperation();
                                this.filtrarData(operation.id);
                                this.toastr.success(
                                    "¡Operación confirmada correctamente!",
                                    "Éxito"
                                );
                                this.canceladas.set(this.canceladas() + 1);
                                this.procesadas.set(this.procesadas() - 1);
                            } else {
                                this.toastr.warning(rs, "Advertencia");
                            }
                        }
                    });
            }
        });
    }

    reenviarOperation(operation: Operation) {
        operation.loadingEmail1 = true;
        this.service.updateOperationReenviar(operation)
            .pipe(
                finalize(() => {
                    operation.loadingEmail1 = false;
                }),
            )
            .subscribe({
                next: (rs: any) => {
                    // El servidor dice qué hizo (envió, reemitió o emitió) o por qué no pudo.
                    const mensaje = rs?.data?.qr || (rs?.success ? 'Comprobante procesado.' : 'No se pudo procesar el comprobante.');
                    if (rs?.success) {
                        this.toastr.success(mensaje);
                        const numero: string | undefined = rs?.data?.number;
                        if (numero && numero.includes('-')) {
                            const [serie, correlativo] = numero.split('-');
                            operation.serie = serie;
                            operation.correlative = Number(correlativo);
                        }
                    } else {
                        this.toastr.warning(mensaje);
                    }
                },
                error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'No se pudo procesar el comprobante.'),
            });
    }

    filtrarData(id: number) {
        const operations = this.dataSource.data.filter((x) => x.id != id);
        this.dataSource = new MatTableDataSource(operations);
        this.store.setPagination(this.length() - 1, this.pageIndex(), this.pageSize());
    }

    openTimeline(operation: Operation): void {

        this.service
            .getByIdAdmi(operation.id)
            .subscribe({
                next: (op) => {
                    this.operation = op;
                    this.layout.openGlobalDrawer(this.timelineTpl);
                },
                error: () => {
                    this.toastr.error(
                        'No se pudo cargar el detalle de la operación',
                        'Error'
                    );
                }
            });

    }

    ngOnDestroy(): void {
        this.layout.closeGlobalDrawer();
        this.socket.off('AddNewOperation');
        this.socket.off('RemoveNewOperation');
    }

    /** Comprobante del motor nativo: se pide con la sesión (sin enlace público). */
    descargarComprobante(element: Operation): void {
        this.fiscal.pdfDeOperacion(element.id).subscribe({
            next: blob => descargarArchivo(blob, `${element.serie}-${element.correlative}.pdf`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'El comprobante todavía no está disponible.'),
        });
    }
}
