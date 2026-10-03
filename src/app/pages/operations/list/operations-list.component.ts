import { VoucherViewerService } from 'src/app/pages/operations/voucher-viewer.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FiscalService } from '../../fiscal/fiscal.service';
import { descargarArchivo, mostrarErrorFiscal } from '../../fiscal/fiscal-comunes';
import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { finalize, lastValueFrom, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OperationsService } from '../operations.service';
import { OperationsStore } from './operations-list.store';
import { Operation, OperationBanks, OperationDTO } from 'src/app/core/models/operations/operations.model';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { MatDialog } from '@angular/material/dialog';
import { TransferOperationComponent } from './transfer/transfer.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { OperationDetailComponent } from './details/details.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Permission } from 'src/app/core/auth/permissions.enum';

const EMPTY_OPERATION_DTO: OperationDTO = {
    operations: [],
    registradas: 0,
    proceso: 0,
    finalizadas: 0,
    canceladas: 0
};

@Component({
    selector: 'app-operations-list',
    standalone: true,
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        RouterModule,
        DateMaskDirective
    ],
    templateUrl: './operations-list.component.html'
})
export class OperationsComponent implements OnInit {
    readonly vouchers = inject(VoucherViewerService);

    private service = inject(OperationsService);
    protected store = inject(OperationsStore);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    private fiscal = inject(FiscalService);
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);

    public authStore = inject(AuthStore);

    displayedColumns: string[] = [
        "id",
        "operation",
        "fecha",
        "envia",
        "recibe",
        "tc",
        "cupon",
        "code"
    ];

    dataSource = new MatTableDataSource<Operation>();
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());

    registradas = signal(0);
    procesadas = signal(0);
    finalizadas = signal(0);
    canceladas = signal(0);

    form = this.fb.nonNullable.group({
        startDate: [new Date(), Validators.required],
        endDate: [new Date(), Validators.required],
        type: ["0", Validators.required],
        status: ["2", Validators.required]
    },
        {
            validators: [
                rangeValidator('startDate', 'endDate', 'date')
            ]
        }
    );

    ngOnInit(): void {
        this.buildColumns();
        this.updateDataSource();
        this.route.queryParamMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(params => {
                const operationId = Number(params.get('operationId'));
                if (operationId > 0) this.cargarOperacionDeNotificacion(operationId);
            });
    }

    get control() {
        return this.form.controls;
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

        this.service.search(
            v.status!,
            v.type!,
            fromDate,
            toDate,
            this.pageIndex(),
            this.pageSize()
        )
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: response => {
                    const data: OperationDTO = response.body ?? EMPTY_OPERATION_DTO;

                    const totalRecords = totalDelEncabezado(response.headers);

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
        this.displayedColumns = [];
        if (this.form.value.status == "1") {
            this.displayedColumns = [
                "id",
                "operation",
                "fecha",
                "envia",
                "recibe",
                "tc",
                "cupon",
                "confirmaTr",
                "cancela",
            ];
        } else if (this.form.value.status == "2") {
            this.displayedColumns = [
                "id",
                "operation",
                "fecha",
                "envia",
                "recibe",
                "tc",
                "cupon",
                "code"
            ];
        } else if (this.form.value.status == "3") {
            this.displayedColumns = [
                "id",
                "operation",
                "fecha",
                "envia",
                "recibe",
                "tc",
                "cupon",
                "code2",
                "correlative",
                "pdf",
                "xml",
            ];
        } else if (this.form.value.status == "0") {
            this.displayedColumns = [
                "id",
                "operation",
                "fecha",
                "envia",
                "recibe",
                "tc",
                "cupon",
            ];
        }
    }

    public cambiarCabezeras(): void {
        this.buildColumns();
        this.loadData();
    }

    private cargarOperacionDeNotificacion(operationId: number): void {
        this.store.setLoading(true);

        const request = this.authStore.hasPermission(Permission.WebsIndex)
            ? this.service.getByIdAdmi(operationId)
            : this.service.getById(operationId);

        request
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: operation => {
                    const fecha = new Date(operation.dateCreation);

                    this.form.patchValue({
                        startDate: fecha,
                        endDate: fecha,
                        type: operation.typeOperation ?? "0",
                        status: operation.status ?? "2"
                    });

                    this.buildColumns();
                    this.store.set({
                        operations: [operation],
                        registradas: operation.status === "1" ? 1 : 0,
                        proceso: operation.status === "2" ? 1 : 0,
                        finalizadas: operation.status === "3" ? 1 : 0,
                        canceladas: operation.status === "0" ? 1 : 0
                    });
                    this.store.setPagination(1, PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, this.pageSize());
                    this.updateDataSource();
                },
                error: () => {
                    this.toastr.error('No se pudo obtener la operación de la notificación', 'Error');
                }
            });
    }

    openTransfer(operationBanks: OperationBanks[]) {
        this.dialog.open(TransferOperationComponent, {
            data: operationBanks,
            disableClose: false,
            panelClass: 'custom-dialog'
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
                    .cancel(operation)
                    .pipe(
                        finalize(() => {
                            operation.loadingCancelar = false;
                        }),
                    )
                    .subscribe({
                        next: (rs: any) => {
                            if (rs == "OK") {
                                this.filtrarData(operation.id, true);
                                this.toastr.success(
                                    "¡Operación confirmada correctamente!",
                                    "Éxito"
                                );
                            } else {
                                this.toastr.warning(rs, "Advertencia");
                            }
                        }
                    });
            }
        });
    }

    filtrarData(id: number, cancel: boolean) {
        const operations = this.dataSource.data.filter((x) => x.id != id);
        this.dataSource = new MatTableDataSource(operations);
        this.store.setPagination(this.length() - 1, this.pageIndex(), this.pageSize());
        if (cancel) {
            this.canceladas.set(this.canceladas() + 1);
            this.procesadas.set(this.procesadas() - 1);
        } else {
            this.procesadas.set(this.procesadas() + 1);
            this.registradas.set(this.registradas() - 1);
        }
    }

    confirmarTransferencia(operation: Operation): void {

        this.service.getByIdAdmi(operation.id)
            .pipe(
                switchMap(op =>
                    this.dialog
                        .open(OperationDetailComponent, {
                            data: op,
                            disableClose: true
                        })
                        .afterClosed()
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (id: number | null) => {
                    if (!id) return;
                    this.filtrarData(id, false);
                },
                error: () => {
                    this.toastr.error(
                        'No se pudo obtener la operación',
                        'Error'
                    );
                }
            });
    }

    /** Comprobante del motor nativo: se pide con la sesión (el PSE daba un enlace público; este no). */
    descargarComprobante(element: Operation): void {
        this.fiscal.pdfDeOperacion(element.id).subscribe({
            next: blob => descargarArchivo(blob, `${element.serie}-${element.correlative}.pdf`),
            error: (e: HttpErrorResponse) => mostrarErrorFiscal(this.toastr, e, 'El comprobante todavía no está disponible.'),
        });
    }
}
