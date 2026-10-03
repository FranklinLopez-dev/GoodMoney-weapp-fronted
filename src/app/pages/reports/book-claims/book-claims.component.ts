import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, inject, computed, Input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { BookClaim, BookClaimResponse } from 'src/app/core/models/reports/book-claims.model';
import { BookClaimsStore } from './book-claims.store';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { BookClaimsService } from './book-claims.service';
import { MaterialModule } from 'src/app/material.module';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { TablerIconsModule } from 'angular-tabler-icons';
import { environment } from 'src/environments/environment';
import { BookClaimDialogComponent } from './dialog/dialog.component';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { BookClaimsDetailsComponent } from './details/details.component';
import {
    trigger,
    state,
    style,
    transition,
    animate,
} from '@angular/animations';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'book-claims',
    standalone: true,
    templateUrl: './book-claims.component.html',
    styleUrls: ['./book-claims.component.scss'],
    imports: [ArchivoPrivadoPipe, AsyncPipe, ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition(
                'expanded <=> collapsed',
                animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
            ),
        ]),
    ],
})
export class BookClaimsComponent {

    @Input() mode: 'default' | 'clients' = 'default';

    readonly store = inject(BookClaimsStore);
    private authStore = inject(AuthStore);
    private appData = inject(UtilsService);

    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;

    private static readonly PESO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

    dataSource = new MatTableDataSource<BookClaim>([]);
    expandedElement: BookClaim | null = null;
    readonly comentario = signal('');

    form = this.fb.nonNullable.group(
        {
            fromDate: [new Date(), Validators.required],
            toDate: [new Date(), Validators.required],
        },
        {
            validators: [rangeValidator('fromDate', 'toDate', 'date')],
        }
    );

    columnsToDisplay: string[] = [
        'id',
        'service',
        'operation',
        'amount',
        'clainType',
        'status'
    ];

    columnsToDisplayWithExpand: string[] = [
        ...this.columnsToDisplay,
        'expand'
    ];

    public readonly baseUrl = environment.apiUrl;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.length());

    constructor(
        private fb: FormBuilder,
        private dialog: MatDialog,
        private toastr: ToastrService,
        private service: BookClaimsService
    ) { }

    get control() {
        return this.form.controls;
    }

    ngOnInit(): void {
        this.updateDataSource();
    }

    private updateDataSource(): void {
        const items = this.store.items() ?? [];
        this.dataSource.data = items;

        // Tras recargar llegan instancias nuevas: sin esto el reclamo abierto se cerraba al comentar o adjuntar.
        if (this.expandedElement) {
            this.expandedElement = items.find(i => i.id === this.expandedElement!.id) ?? null;
        }
    }

    loadData(): void {
        if (this.form.invalid) return;
        this.fetchData();
    }


    onPageChange(e: PageEvent): void {
        this.store.setPagination(this.length(), e.pageIndex, e.pageSize);
        this.fetchData();
    }

    private fetchData(): void {
        // Aqui y no en loadData(): la paginacion entra por este camino y se quedaba sin spinner.
        this.store.setLoading(true);

        const v = this.form.value;
        const fromDate = aFechaApi(new Date(v.fromDate!));
        const toDate = aFechaApi(new Date(v.toDate!));

        if (this.mode === 'clients') {
            this.service.getBookClaims(
                fromDate,
                toDate,
                this.store.pageIndex(),
                this.store.pageSize()
            ).pipe(finalize(() => this.store.setLoading(false))).subscribe({
                next: (response) => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.store.set(data);
                    this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                },
            });
        } else {
            this.service.getBookClaimsAdmin(
                fromDate,
                toDate,
                this.store.pageIndex(),
                this.store.pageSize()
            ).pipe(finalize(() => this.store.setLoading(false))).subscribe({
                next: (response) => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.store.set(data);
                    this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                },
            });
        }

    }

    agregarReclamo(): void {

        const dialogRef = this.dialog.open(BookClaimDialogComponent, {
            autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                const code = Number(result);
                this.service.assignCode(code).subscribe({
                    next: (rs) => {
                        if (rs == 'OK') {
                            this.toastr.success('Reclamo agregado correctamente.', 'Éxito');
                            this.fetchData();
                        } else {
                            this.toastr.warning(rs, 'Advertencia');
                        }
                    }
                });
            }
        });
    }

    openDialog(action: string, obj: any): void {
        obj.action = action;

        const dialogRef = this.dialog.open(BookClaimsDetailsComponent, {
            data: obj,
            autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result.event === 'Nuevo') {
                let bookClaim: BookClaim = result.data;
                bookClaim.email = this.appData.profile()?.email!;
                bookClaim.names = this.appData.profile()?.names;
                bookClaim.lastNamePaterno = this.appData.profile()?.lastNamePaterno;
                bookClaim.lastNameMaterno = this.appData.profile()?.lastNameMaterno;
                bookClaim.documentTypeId = this.appData.profile()?.documentTypeId!;
                bookClaim.documentNumber = this.appData.profile()?.documentNumber!;
                bookClaim.address = this.appData.profile()?.address;
                bookClaim.district = this.appData.profile()?.district;
                bookClaim.province = this.appData.profile()?.province;
                bookClaim.departament = this.appData.profile()?.departament;
                bookClaim.phone = this.appData.profile()?.phone;

                this.service.saveBookClaim(bookClaim).subscribe({
                    next: () => {
                        this.toastr.success('Reclamo creado correctamente.', 'Éxito');
                        this.fetchData();
                    }
                });
            }
        });
    }

    saveResponse(element: BookClaim): void {
        const message = this.comentario().trim();
        if (!message) {
            this.toastr.error('El comentario no puede estar vacío');
            return;
        }

        let response: BookClaimResponse = {} as BookClaimResponse;
        response.bookClaimId = element.id;
        response.responseText = message;

        this.service.saveBookClaimResponse(response).subscribe({
            next: () => {
                this.toastr.success('Reclamo creado correctamente.', 'Éxito');
                this.comentario.set('');
                this.fetchData();
            }
        });
    }

    toggleRow(element: BookClaim): void {
        this.expandedElement = this.expandedElement === element ? null : element;
        this.comentario.set('');
    }

    public onselectImage(event: any, element: BookClaim): void {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > BookClaimsComponent.PESO_MAXIMO_IMAGEN) {
            this.toastr.warning('La imagen no debe superar los 5 MB.', 'Advertencia');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {

            let response: BookClaimResponse = {} as BookClaimResponse;
            response.bookClaimId = element.id;
            response.responseText = "Adjunto imagen al reclamo.";
            response.attachmentPathByte = e.target.result.replace(/^data:image\/[a-z]+;base64,/, "");

            this.service.saveBookClaimResponse(response).subscribe({
                next: () => {
                    this.toastr.success('Reclamo creado correctamente.', 'Éxito');
                    this.fetchData();
                }
            });
        }
    }

    updateStatus(element: BookClaim): void {
        let bookClaim = JSON.parse(JSON.stringify(element));
        bookClaim.status = "2";
        this.service.updateBookClaim(bookClaim).subscribe({
            next: () => {
                element.status = '2';
                this.toastr.success('Estado editado correctamente.', 'Éxito');
            }
        });
    }

    finalizar(element: BookClaim): void {
        let bookClaim = JSON.parse(JSON.stringify(element));
        bookClaim.status = "3";
        this.service.updateBookClaim(bookClaim).subscribe({
            next: () => {
                element.status = '3';
                this.toastr.success('Estado editado correctamente.', 'Éxito');
            }
        });
    }

    cancelar(element: BookClaim): void {
        let bookClaim = JSON.parse(JSON.stringify(element));
        bookClaim.status = "0";
        this.service.updateBookClaim(bookClaim).subscribe({
            next: () => {
                element.status = '0';
                this.toastr.success('Estado editado correctamente.', 'Éxito');
            }
        });
    }

    canEdit(): boolean {
        return this.authStore.hasPermission(Permission.BookclaimsIndex);
    }

    openImagen(ruta: string) {
        this.dialog.open(FileViewerDialogComponent, {
            data: {
                name: '',
                type: 'PNG',
                url: this.baseUrl + '/' + ruta
            },
            panelClass: 'file-viewer-dialog',
            maxWidth: '90vw',
            maxHeight: '90vh',
        });
    }
}
