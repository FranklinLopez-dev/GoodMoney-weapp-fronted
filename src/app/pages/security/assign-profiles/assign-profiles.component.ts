import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { environment } from 'src/environments/environment';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { AssignProfilesStore } from './assign-profiles.store';
import { Profile } from 'src/app/core/models';
import { AssignProfileDetailComponent } from './details/profile-details.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateNaturalComponent } from './create-natural/create-natural.component';
import { UsersService } from '../users/users.service';
import { UsersStore } from '../users/users.store';
import { ClientsModalComponent } from './users-dialog.component';
import { CreateJuridicoComponent } from './create-juridico/create-juridico.component';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'assign-profiles',
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        MatDividerModule,
        ClipboardModule,
        ReactiveFormsModule,
        FallbackImgDirective,
        AssignProfileDetailComponent,
        CreateJuridicoComponent
    ],
    templateUrl: './assign-profiles.component.html'
})
export class AssignProfileComponent {

    public store = inject(AssignProfilesStore);
    public usersStore = inject(UsersStore);
    private dialog = inject(MatDialog);
    private usesrService = inject(UsersService);

    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.store.pageSize());
    pageIndex = computed(() => this.store.pageIndex());
    length = computed(() => this.store.totalRecords());
    mode = computed(() => this.store.mode());
    isEdit = computed(() => this.store.isEdit());
    searchControl = new FormControl('');

    dataSource = new MatTableDataSource<Profile>([]);
    displayedColumns: string[] = [
        'id', 'nombres', 'email', 'action',
    ];
    public readonly baseUrl = environment.apiUrl;
    
    private destroyRef = inject(DestroyRef);

    constructor(
        private service: ProfilesService
    ) { }

    ngOnInit(): void {
        this.updateDataSource();

        this.searchControl.valueChanges
            .pipe(conPausaDeTipeo(), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.cargarData());
    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    cargarData() {
        this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
        this.loadData();
    }

    loadData(): void {

        this.store.setLoading(true);
        const searchTerm = this.searchControl.value ?? '';

        this.service.getIsFromIndividual(
            this.pageIndex(),
            this.pageSize(), searchTerm
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

    changeProfile(profile: Profile): void {
        this.store.setProfile(profile);
        this.store.setMode('edit');
    }

    private updateDataSource(): void {
        this.dataSource.data = this.store.items() ?? [];
    }

    create(profile: Profile) {

        this.store.setProfile(profile);

        if (!profile.documentTypeIsNatural) {
            this.store.setEdit(true);
        } else {
            const dialogRef = this.dialog.open(CreateNaturalComponent, {
                disableClose: true,
                width: '400px',
            });

            dialogRef.afterClosed().subscribe({
                next: (result) => {
                    if (!result) return;
                    this.loadData();
                },
            });
        }


    }

    openDialog(profile: Profile) {
        this.store.setProfile(profile);

        const isLargeScreen = window.innerWidth > 992 ? '70vw' : '95vw';
        this.usesrService.searchClients('', PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE).subscribe({
            next: response => {
                const data = response.body ?? [];

                const totalRecords = totalDelEncabezado(response.headers);

                this.usersStore.set(data);
                this.usersStore.setPagination(totalRecords, PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

                const dialogRef = this.dialog.open(ClientsModalComponent, {
                    disableClose: true,
                    minWidth: isLargeScreen
                })

                dialogRef.afterClosed().subscribe(result => {
                    if (!result) return;
                    this.loadData();
                });
            }
        });


    }

    ngOnDestroy(): void {
        this.store.clearAll();
    }

}
