import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { aFechaApi } from 'src/app/shared/utils/fechas';
import { Component, computed, DestroyRef, inject, Input, OnInit, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { finalize, lastValueFrom } from 'rxjs';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { ToastrService } from 'ngx-toastr';
import { Client, FiltrosClientes, Users } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from './users.service';
import { UsersStore } from './users.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { environment } from 'src/environments/environment';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { UserRolesModalComponent } from './user-roles/user-roles-modal.component';
import { RouterModule } from '@angular/router';
import { ClientDialogComponent } from '../../reports/clients/dialog/dialog.component';
import { COLUMNAS_PDF_CLIENTES } from '../../reports/clients/clientes-pdf';
import { ExportadorReportesService } from 'src/app/shared/services/exportador-reportes.service';
import { ArchivosPrivadosService } from 'src/app/shared/services/archivos-privados.service';
import { BotonesExportarComponent } from 'src/app/shared/components/botones-exportar/botones-exportar.component';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { TitleCasePipe, AsyncPipe } from '@angular/common';
import { UserEmailDialogComponent } from './users-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AssignProfilesStore } from '../assign-profiles/assign-profiles.store';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        FallbackImgDirective,
        RouterModule,
        TitleCasePipe,
        BotonesExportarComponent
    ],
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {

    @Input() mode: 'default' | 'clients' | 'profiles' = 'default';

    private service = inject(UsersService);
    private archivos = inject(ArchivosPrivadosService);
    private authService = inject(AuthService);
    private destroyRef = inject(DestroyRef);
    protected store = inject(UsersStore);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);
    public baseUrl = environment.apiUrl;
    loadingToggle = new Set<string>();

    public authStore = inject(AuthStore);
    readonly Permission = Permission;

    displayedColumns: string[] = [];
    private appData = inject(UtilsService);

    dataSource = new MatTableDataSource<Users>();
    loading = this.store.loading;
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());

    searchControl = new FormControl('');
    private profilesStore = inject(AssignProfilesStore);
    profile = this.profilesStore.profile;

    /** Filtros de clientes enviados al backend junto con paginacion y busqueda. */
    filtroCorreo = new FormControl('');   // '' todos | '1' validado | '0' sin validar
    filtroCuenta = new FormControl('');   // '' todas | '1' bloqueada | '0' activa

    private exportador = inject(ExportadorReportesService);

    constructor(@Optional() public dialogRef?: MatDialogRef<UsersComponent>) { }

    ngOnInit(): void {
        this.displayedColumns =
            this.mode === 'clients'
                ? [
                    'num',
                    'names',
                    'document',
                    'email',
                    'telf',
                    'enabledEmail',
                    'lockoutEnabled',
                    'action'
                ] :
                this.mode === 'profiles' ?
                    [
                        'num',
                        'names',
                        'document',
                        'email',
                        'action'
                    ]
                    : [
                        'num',
                        'names',
                        'email',
                        'roles',
                        'enabledEmail',
                        'lockoutEnabled',
                        'action'
                    ];

        this.updateDataSource();

        this.searchControl.valueChanges
            .pipe(conPausaDeTipeo(), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.cargarData());

        if (this.mode === 'clients') {
            [this.filtroCorreo, this.filtroCuenta].forEach(control =>
                control.valueChanges
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe(() => this.cargarData())
            );
        }
    }


    private updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }
    cargarData() {
        this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
        this.loadData();
    }

    loadData(): void {
        this.store.setLoading(true);
        const searchTerm = this.searchControl.value ?? '';

        if (this.mode === 'clients' || this.mode === 'profiles') {
            this.service.searchClients(
                searchTerm,
                this.pageIndex(),
                this.pageSize(),
                this.valorFiltroBooleano(this.filtroCorreo.value),
                this.valorFiltroBooleano(this.filtroCuenta.value)
            )
                .pipe(finalize(() => this.store.setLoading(false)))
                .subscribe({
                    next: response => {
                        const data = response.body ?? [];

                        const totalRecords = totalDelEncabezado(response.headers);

                        this.store.set(data);
                        this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                        this.updateDataSource();
                    }
                });
        } else {
            this.service.search(
                searchTerm,
                this.pageIndex(),
                this.pageSize()
            )
                .pipe(finalize(() => this.store.setLoading(false)))
                .subscribe({
                    next: response => {
                        const data = response.body ?? [];

                        const totalRecords = totalDelEncabezado(response.headers);

                        this.store.set(data);
                        this.store.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                        this.updateDataSource();
                    }
                });
        }


    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    private valorFiltroBooleano(value: string | null): boolean | null {
        if (value === '1') return true;
        if (value === '0') return false;
        return null;
    }

    private filtrosActuales(): FiltrosClientes {
        return {
            busqueda: (this.searchControl.value ?? '').trim(),
            emailConfirmed: this.valorFiltroBooleano(this.filtroCorreo.value),
            lockoutEnabled: this.valorFiltroBooleano(this.filtroCuenta.value),
        };
    }

    private descripcionDeFiltros(filtros: FiltrosClientes): string {
        const partes: string[] = [];

        if (filtros.busqueda) partes.push(`Búsqueda "${filtros.busqueda}"`);
        if (filtros.emailConfirmed !== null) {
            partes.push(`Correo validado: ${filtros.emailConfirmed ? 'Activo' : 'Inactivo'}`);
        }
        if (filtros.lockoutEnabled !== null) {
            partes.push(`Cuenta: ${filtros.lockoutEnabled ? 'Bloqueada' : 'Activa'}`);
        }

        return partes.length ? partes.join(' · ') : 'Ninguno (todos los clientes)';
    }

    exportarExcel(): void {
        this.exportador.excel(this.service.excelClientes(this.filtrosActuales()), 'REPORTE-CLIENTES');
    }

    exportarPdf(): void {
        const filtros = this.filtrosActuales();

        this.exportador.pdf(this.service.clientesParaReporte(filtros), 'REPORTE-CLIENTES', {
            titulo: 'REPORTE DE CLIENTES',
            columnas: COLUMNAS_PDF_CLIENTES,
            filtros: this.descripcionDeFiltros(filtros),
        });
    }

    enabledEmail(event: MatSlideToggleChange, user: Users): void {

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: user.emailConfirmed ? 'Deshabilitar coreo' : 'Habilitar correo',
                message: `¿Estás seguro que deseas ${user.emailConfirmed ? 'deshabilitar' : 'habilitar'} el correo del usuario ${user.names}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) {
                    event.source.checked = !event.checked;
                    return;
                }

                if (this.loadingToggle.has(user.id)) return;

                this.loadingToggle.add(user.id);

                const previousValue = user.emailConfirmed;

                user.emailConfirmed = !user.emailConfirmed;

                this.service.enabledEmail(user)
                    .pipe(finalize(() => {
                        this.loadingToggle.delete(user.id);
                    }))
                    .subscribe({
                        next: () => {
                            this.toastr.success(
                                user.emailConfirmed ? 'Usuario activado' : 'Usuario desactivado'
                            );
                        },
                        error: () => {
                            user.emailConfirmed = previousValue;
                        }
                    });
            },
        });

    }

    resendConfirmation(user: Users): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Reenviar correo de validación',
                message: `¿Deseas reenviar el enlace de validación al correo ${user.email}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                const key = user.id + '-resend';
                if (this.loadingToggle.has(key)) return;

                this.loadingToggle.add(key);

                this.authService.resendEmailConfirmation(user.email)
                    .pipe(finalize(() => this.loadingToggle.delete(key)))
                    .subscribe({
                        next: () => {
                            this.toastr.success('Se reenviò el correo de validación.');
                        },
                        error: (err) => {
                            this.toastr.error(err?.error || 'No se pudo reenviar el correo.');
                        }
                    });
            },
        });
    }


    selectedUser(user: Users) {
        if (this.mode !== 'profiles') return;

        this.store.setLoading(true);

        const payload = {
            userId: user.id,
            profileId: this.profile()?.id
        }

        this.service.assignProfile(payload as any)
            .pipe(finalize(() => {
                this.store.setLoading(false);
            }))
            .subscribe({
                next: (response) => {
                    if (response == 'OK') {
                        this.toastr.success('Perfil asignado correctamente');
                        this.dialogRef?.close(true);
                    } else {
                        this.toastr.warning(response);
                    }

                }
            });
    }

    lockoutEnabled(event: MatSlideToggleChange, user: Users): void {

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: !user.lockoutEnabled ? 'Bloquear usaurio' : 'Desbloquear usuario',
                message: `¿Estás seguro que deseas ${!user.lockoutEnabled ? 'bloquear' : 'desbloquear'} el usuario ${user.names}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) {
                    event.source.checked = !event.checked;
                    return;
                }

                if (this.loadingToggle.has(user.id)) return;

                this.loadingToggle.add(user.id);

                const previousValue = user.lockoutEnabled;

                user.lockoutEnabled = !user.lockoutEnabled;

                this.service.lockoutEnabled(user)
                    .pipe(finalize(() => {
                        this.loadingToggle.delete(user.id);
                    }))
                    .subscribe({
                        next: () => {
                            this.toastr.success(
                                !user.lockoutEnabled ? 'Usuario desbloqueado' : 'Usuario bloqueado'
                            );
                        },
                        error: () => {
                            user.lockoutEnabled = previousValue;
                        }
                    });
            },
        });

    }

    changeEmail(user: Users): void {
        const dialogRef = this.dialog.open(UserEmailDialogComponent, {
            disableClose: true,
            width: '400px',
            data: user
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;
                this.loadData();
            },
        });

    }

    openRolesModal(user: Users): void {
        const dialogRef = this.dialog.open(UserRolesModalComponent, {
            disableClose: true,
            data: { user }
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (!result) return;
                this.loadData();
            },
        });
    }

    canEnabled(): boolean {
        return this.authStore.hasPermission(Permission.UserUpdate);
    }

    canRoles(): boolean {
        return this.authStore.hasPermission(Permission.UserRoles);
    }

    canProfiles(): boolean {
        return this.authStore.hasPermission(Permission.ProfileIndex);
    }

    openDialog(user: Users) {
        const dialogRef = this.dialog.open(ClientDialogComponent, {
            data: user,
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.generarFichaUsuario(user, result)
            }
        });
    }

    async generarFichaUsuario(user: Users, filtro: any) {
        // jsPDF son ~400 KB que solo hacen falta al pulsar. Se pide aqui para que baje EN PARALELO con la consulta.
        const jsPDFPromise = import('jspdf');
        const stared = aFechaApi(new Date(filtro.fromDate));
        const end = aFechaApi(new Date(filtro.toDate));

        const op = this.service.getClientId(user.id, stared, end);
        const cliente: Client = await lastValueFrom(op);
        const profileAdmin = cliente.profiles.find(p => p.isAdmin);

        // Documento en horizontal
        const { default: jsPDF } = await jsPDFPromise;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = 15;

        const checkPageSpace = (needed: number): void => {
            if (y + needed > pageHeight - 15) {
                doc.addPage();
                y = 15;
            }
        };

        // ENCABEZADO
        try {
            if (this.appData.company()?.logo) {
                const logoBase64 = await this.loadImageAsBase64(
                    'data:image/jpeg;base64,' + this.appData.company()!.logo
                );
                doc.addImage(logoBase64, 'PNG', 10, 10, 40, 15);
            }
        } catch {
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(this.appData.company()?.name || '', pageWidth / 2, 20, { align: 'center' });

        y = 35;
        doc.setFontSize(16);
        doc.text('FICHA DE USUARIO', pageWidth / 2, y, { align: 'center' });
        y += 10;

        // DATOS PRINCIPALES
        doc.setFontSize(11);
        doc.text('DATOS DEL USUARIO PRINCIPAL', 10, y);
        y += 5;
        checkPageSpace(40);

        const userProfile = profileAdmin ?? cliente.profiles[0];
        try {
            const foto = await lastValueFrom(this.archivos.url(userProfile.profilePhoto));
            if (foto) {
                const photoBase64 = await this.loadImageAsBase64(foto);
                doc.addImage(photoBase64, 'JPG', 10, y, 30, 30);
            }
        } catch {
        }

        doc.setFont('helvetica', 'normal');
        const infoX = 45;
        doc.text(`Nombre: ${userProfile.names} ${userProfile.lastNames || ''}`, infoX, y + 5);
        doc.text(`${userProfile.documentTypeName}: ${userProfile.documentNumber}`, infoX, y + 10);
        doc.text(`Correo: ${cliente.applicationUser.email}`, infoX, y + 15);
        doc.text(`Celular: ${userProfile.cellPhone || '-'}`, infoX, y + 20);
        doc.text(`Dirección: ${userProfile.address || '-'}`, infoX, y + 25);
        y += 40;

        // PERFILES
        doc.setFont('helvetica', 'bold');
        doc.text('PERFILES ASOCIADOS', 10, y);
        y += 6;

        for (const perfil of cliente.profiles) {
            checkPageSpace(25);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(`${perfil.names} ${perfil.lastNames || ''}`, 10, y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`${perfil.documentTypeName}: ${perfil.documentNumber}`, 10, y + 5);
            doc.text(`Celular: ${perfil.cellPhone || '-'}`, 60, y + 5);
            doc.text(`Correo: ${perfil.email || '-'}`, 130, y + 5);
            y += 10;

            // OPERACIONES
            const operaciones = perfil.operations || [];
            const compras = operaciones.filter((op: any) => op.typeOperation === 'COMPRA' || op.typeOperation == '1');
            const ventas = operaciones.filter((op: any) => op.typeOperation === 'VENTA' || op.typeOperation == '2');
            const totalCompras = compras.reduce((sum: any, op: any) => sum + (op.total || 0), 0);
            const totalVentas = ventas.reduce((sum: any, op: any) => sum + (op.total || 0), 0);

            doc.setFont('helvetica', 'bold');
            doc.text('OPERACIONES', 10, y);
            y += 5;

            if (operaciones.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.text('Sin operaciones registradas en el rango de fechas.', 10, y);
                y += 10;
            } else {
                // Tabla de operaciones
                const headers = ['#', 'FECHA', 'TIPO', 'MODO', 'MONTO', 'T.C.', 'TOTAL'];
                const tableX = 10;
                const tableWidth = pageWidth - 20;
                const colCount = headers.length;
                const colWidths = headers.map(() => tableWidth / colCount);

                const drawHeader = () => {
                    doc.setFillColor(0, 100, 200);
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(9);
                    let x = tableX;
                    doc.rect(tableX, y, tableWidth, 8, 'F');
                    for (let i = 0; i < headers.length; i++) {
                        doc.text(headers[i], x + colWidths[i] / 2, y + 5, { align: 'center' });
                        x += colWidths[i];
                    }
                    y += 8;
                    doc.setTextColor(0, 0, 0);
                };

                drawHeader();
                let idx = 0;

                for (const op of operaciones) {
                    checkPageSpace(10);
                    idx++;
                    const modo = op.typeMpodera === 1 ? 'Manual' : 'Automática';
                    const fecha = op.dateCreation
                        ? new Date(op.dateCreation).toLocaleString('es-PE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })
                        : '-';

                    const values = [
                        idx.toString(),
                        fecha,
                        op.typeOperation == '1' ? 'COMPRA' :
                            op.typeOperation == '2' ? 'VENTA' : op.typeOperation,
                        modo,
                        this.formateador(op.monto || 0),
                        op.tipoCambio?.toFixed(3) ?? '-',
                        this.formateador(op.total || 0)
                    ];

                    let x = tableX;
                    for (let i = 0; i < values.length; i++) {
                        doc.rect(x, y, colWidths[i], 8);
                        doc.text(values[i], x + colWidths[i] / 2, y + 5, { align: 'center' });
                        x += colWidths[i];
                    }
                    y += 8;
                }

                y += 4;
                checkPageSpace(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL COMPRA: S/ ${this.formateador(totalCompras)}`, 10, y);
                doc.text(`TOTAL VENTA: S/ ${this.formateador(totalVentas)}`, 100, y);
                y += 10;
            }

            // CUENTAS BANCARIAS
            const bancos = perfil.profileBanks || [];
            checkPageSpace(20);
            doc.setFont('helvetica', 'bold');
            doc.text('CUENTAS BANCARIAS', 10, y);
            y += 5;

            if (bancos.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.text('Sin cuentas bancarias registradas.', 10, y);
                y += 10;
            } else {
                const headers = ['BANCO', 'TIPO CTA', 'MONEDA', 'N° CTA / CCI'];
                const tableX = 10;
                const tableWidth = pageWidth - 20;
                const colCount = headers.length;
                const colWidths = headers.map(() => tableWidth / colCount);

                const drawBankHeader = () => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setFillColor(60, 60, 60);
                    doc.setTextColor(255, 255, 255);
                    let x = tableX;
                    doc.rect(tableX, y, tableWidth, 8, 'F');
                    for (let i = 0; i < headers.length; i++) {
                        doc.text(headers[i], x + colWidths[i] / 2, y + 5, { align: 'center' });
                        x += colWidths[i];
                    }
                    y += 8;
                    doc.setTextColor(0, 0, 0);
                };

                drawBankHeader();

                for (const b of bancos) {
                    checkPageSpace(10);
                    let x = tableX;

                    const cuentaValida = (n: string) => n && !/^0+$/.test(n);
                    let cuentaTexto = '-';
                    if (cuentaValida(b.accountNumber)) {
                        cuentaTexto = `N° CTA: ${b.accountNumber}`;
                    } else if (cuentaValida(b.accountNumberCci)) {
                        cuentaTexto = `CCI: ${b.accountNumberCci}`;
                    }

                    const values = [
                        b.bankName || '-', b.typeAccount == '1' ? 'AHORRO' : 'CORRIENTE', b.coinId || '-', cuentaTexto
                    ];

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    for (let i = 0; i < values.length; i++) {
                        doc.rect(x, y, colWidths[i], 8);
                        doc.text(values[i], x + 2, y + 5);
                        x += colWidths[i];
                    }
                    y += 8;
                }

                y += 10;
            }
        }

        // FOOTER
        const totalPages = doc.getNumberOfPages();
        const currentDate = new Date().toLocaleString('es-PE');
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const footerY = pageHeight - 8;
            doc.setFontSize(8);
            doc.text('FICHA DE USUARIO', 10, footerY);
            doc.text(`${i}/${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
            doc.text(currentDate, pageWidth / 2, footerY, { align: 'center' });
        }

        doc.output('dataurlnewwindow');
    }

    formateador = (value: number) =>
        new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    formatDate(d?: string | Date) {
        if (!d) return '';
        const dt = typeof d === 'string' ? new Date(d) : d;
        return dt.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }

    async loadImageAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();

        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }


}


