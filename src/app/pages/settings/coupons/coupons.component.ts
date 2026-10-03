import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { Coupons, CouponsUser, Users } from 'src/app/core/models';
import { debounceTime, finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { CouponsService } from './coupons.service';
import { CouponsStore } from './coupons.store';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CouponsUsersStore } from './coupons-users.store';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { dateTimeRangeValidator, parseDateAndTime } from 'src/app/shared/validators/date-time-range.validator';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Component({
    selector: 'app-coupons',
    standalone: true,
    imports: [MaterialModule, TablerIconsModule, ReactiveFormsModule, DateMaskDirective],
    templateUrl: './coupons.component.html'
})
export class CouponsComponent implements OnInit {
    @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }

    private service = inject(CouponsService);
    public store = inject(CouponsStore);
    private authStore = inject(AuthStore);
    private dialog = inject(MatDialog);
    private usersStore = inject(CouponsUsersStore);
    @ViewChild('userInput') userInput: ElementRef<HTMLInputElement> | undefined;

    dataSource = new MatTableDataSource<Coupons>();
    displayedColumns = ['num', 'code', 'description', 'descuento', 'isUsers', 'fechaInicio', 'fechaFin', 'compra', 'venta', 'numOperaciones', 'numOperacionesGlobal', 'isActive', 'actions'];
    private paginator: MatPaginator;

    users = this.usersStore.users;
    loading = this.store.loading;
    usersSelected: Users[] = [];
    usersFilters: Users[] = [];
    searchTerm = new FormControl<string>('');
    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;

    editing = false;
    editMode: 'create' | 'edit' = 'create';

    fb = inject(FormBuilder);

    private codigoRepetido(): ValidatorFn {
        return noRepetido(() => this.store.items(), 'code', () => this.form.getRawValue().id);
    }

    form = this.fb.nonNullable.group({
        id: [null],
        code: ['', [Validators.required, this.codigoRepetido()]],
        description: ['', Validators.required],
        dateStart: [null, Validators.required],
        dameEnd: [null, Validators.required],
        timeStart: [null, Validators.required],
        timeEnd: [null, Validators.required],
        discount: [null, Validators.required],
        numOperations: [null, Validators.required],
        numOperationsGlobal: [null, Validators.required],
        isCompra: [true],
        isVenta: [true],
        isUsers: [true],
        isActive: [true],
        couponUsers: this.fb.control<CouponsUser[]>([]),
    },
        {
            validators: [
                dateTimeRangeValidator(
                    'dateStart',
                    'timeStart',
                    'dameEnd',
                    'timeEnd'
                )
            ]
        }
    );

    get control() {
        return this.form.controls;
    }

    readonly Permission = Permission;

    constructor(private toastr: ToastrService) { }

    ngOnInit(): void {
        this.updateDataSource();
        this.form.get('isUsers')?.valueChanges.subscribe(isUsers => {
            if (isUsers === true) {
                this.usersSelected = [];
                this.usersFilters = [];
                this.searchTerm.setValue('');
                if (this.userInput && this.userInput.nativeElement) {
                    this.userInput.nativeElement.value = '';
                }
            } 
        });
    }

    private updateDataSource() {
        this.dataSource.data = this.store.items() ?? [];
    }

    applyFilter(value: string) {
        this.dataSource.filter = value.trim().toLowerCase();
    }

    private setDataSourceAttributes() {
        this.dataSource.paginator = this.paginator;
    }

    startCreate() {
        this.editing = true;
        this.editMode = 'create';
        this.form.reset();
        this.usersSelected = [];
        this.usersFilters = [];
        this.searchTerm.setValue('');
    }

    startEdit(item: Coupons) {
        this.editing = true;
        this.editMode = 'edit';
        const patched = {
            ...item,
            dateStart: item.dateStart ? new Date(item.dateStart) : null,
            dameEnd: item.dameEnd ? new Date(item.dameEnd) : null,
            timeStart: item.dateStart ? new Date(item.dateStart) : null,
            timeEnd: item.dameEnd ? new Date(item.dameEnd) : null,
        };
        this.form.patchValue(patched as any);
        if ((item as any).couponUsers && (item as any).couponUsers.length > 0) {
            this.usersSelected = (item as any).couponUsers.map((u: any) => ({
                id: u.applicationUserId ?? u.id,
                email: u.applicationUserEmail ?? u.email,
                names: u.applicationUser?.names ?? ''
            } as Users));
        } else {
            this.usersSelected = [];
        }
        this.usersFilters = [];
        this.searchTerm.setValue('');
    }

    cancelEdit() {
        this.editing = false;
        this.usersSelected = [];
        this.usersFilters = [];
        this.searchTerm.setValue('');
    }

    save() {
        if (this.form.invalid) return;

        const payload: any = this.form.getRawValue();

        payload.couponUsers = this.usersSelected.map(user => ({
            applicationUserId: user.id,
            applicationUserEmail: user.email
        }));
        payload.dateStart = parseDateAndTime(payload.dateStart, payload.timeStart);
        payload.dameEnd = parseDateAndTime(payload.dameEnd, payload.timeEnd);
        if (this.editMode === 'create') {
            this.service.create(payload as any).subscribe({
                next: () => {
                    this.toastr.success('Cupón creado correctamente', 'Éxito');
                    this.editing = false;
                    this.usersSelected = [];
                    this.reload();
                }
            });
        } else if (this.editMode === 'edit') {
            this.service.update(payload as any).subscribe({
                next: () => {
                    this.toastr.success('Cupón actualizado', 'Éxito');
                    this.editing = false;
                    this.usersSelected = [];
                    this.reload();
                }
            });
        }
    }

    delete(item: Coupons) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Eliminar cupón',
                message: `¿Estás seguro que deseas eliminar este cupón "${item.description}"?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.service.delete(item).subscribe({
                    next: (response) => {
                        if (response == 'OK') {
                            this.toastr.success('Cupón eliminado exitosamente');
                            this.store.remove(item.id);
                            this.dataSource.data = this.store.items()!;
                        } else {
                            this.toastr.warning(response, 'Advertencia');
                        }
                    }
                });
            },
        });
    }

    canCreate() { return this.authStore.hasPermission(Permission.CouponsCreate); }
    canUpdate() { return this.authStore.hasPermission(Permission.CouponsUpdate); }
    canDelete() { return this.authStore.hasPermission(Permission.CouponsDelete); }

    loadUsers(searchTerm: string) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            this.usersFilters = [];
            return;
        }

        this.service.getUsers(searchTerm).subscribe({
            next: (users) => {
                const mapped: Users[] = users.map((u: any) => {
                    if ('id' in u && 'email' in u) return u as Users;
                    return {
                        id: u.applicationUserId ?? u.id,
                        email: u.applicationUserEmail ?? u.email,
                        names: u.applicationUser?.names ?? ''
                    } as Users;
                });

                const filtered = mapped.filter(
                    user => !this.usersSelected.some(selected => selected.id === user.id)
                );
                this.usersFilters = filtered;
            },
            error: () => {
                this.usersFilters = [];
            }
        });
    }

    removeUsers(user: Users) {
        this.usersSelected = this.usersSelected.filter(u => u.id !== user.id);
    }

    addUser(user: Users) {
        if (!this.usersSelected.some(u => u.id === user.id)) {
            this.usersSelected = [...this.usersSelected, user];
            this.usersFilters = [];
            this.searchTerm.setValue('');
            setTimeout(() => {
                if (this.userInput && this.userInput.nativeElement) this.userInput.nativeElement.value = '';
            }, 0);
        }
    }

    displayUser(user: Users | null) {
        if (!user) return '';
        return `${user.names ?? ''} (${user.email})`;
    }

    onSearchUsers() {
        const val = this.searchTerm.value || '';
        this.loadUsers(val);
    }

    private reload() {
        this.store.setLoading(true);

        this.service.getAll()
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe(data => {
                this.store.set(data);
                this.dataSource.data = data;
            });
    }
}
