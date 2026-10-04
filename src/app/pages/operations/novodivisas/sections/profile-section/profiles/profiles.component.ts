import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, computed, inject, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { finalize } from 'rxjs';
import { DocumentType, Profile } from 'src/app/core/models';
import { Columns } from 'src/app/core/models/operations/operations.model';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { environment } from 'src/environments/environment';
import { NovodivisasStore } from '../../../novodivisas.store';
import { ProfilesStore } from './profiles.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'operation-web-profiles',
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        MatDividerModule,
        ClipboardModule,
        ReactiveFormsModule,
        FallbackImgDirective
    ],
    templateUrl: './profiles.component.html'
})
export class SearchProfileComponent {

    private store = inject(NovodivisasStore);
    public profileStore = inject(ProfilesStore);
    readonly table = this.store.table;

    pageSizeOptions = PAGINATION_CONFIG.PAGE_SIZE_OPTIONS;
    pageSize = computed(() => this.profileStore.pageSize());
    pageIndex = computed(() => this.profileStore.pageIndex());
    length = computed(() => this.profileStore.totalRecords());

    columns$: Columns[] = [];
    documentTypes: DocumentType[] = [];

    searchForm = this._formBuilder.group({
        searchTerm: [''],
        searchColumn: [null, Validators.required],
        documentTypeId: [null],
    });

    dataSource = new MatTableDataSource<Profile>([]);
    displayedColumns: string[] = [
        'id', 'nombres', 'email', 'action',
    ];
    public readonly baseUrl = environment.apiUrl;

    constructor(
        private _formBuilder: FormBuilder,
        private service: ProfilesService,
        public dialogRef: MatDialogRef<SearchProfileComponent>,
        @Inject(MAT_DIALOG_DATA) public natural: string
    ) { }

    ngOnInit(): void {

        this.columns$ = this.table()?.columns!;
        this.documentTypes = this.table()?.documentTypes!;

        if (this.natural == '0') {
            this.documentTypes = this.table()?.documentTypes.filter(d => !d.isNatural)!;
        }

        this.searchForm.get('searchColumn')?.setValue(this.columns$[0].clave as any);
        this.searchForm.get('documentTypeId')?.setValue(this.documentTypes[0].id as any);

        this.updateDataSource();

    }

    onPageChange(event: PageEvent): void {
        this.profileStore.setPagination(event.length, event.pageIndex, event.pageSize);
        this.loadData();
    }

    loadData(): void {
        // La guarda va antes del spinner: si no, quedaría girando con loading en true.
        if (this.searchForm.invalid) return;

        this.profileStore.setLoading(true);

        let searchTerm = ' ';
        let searchTerm2 = '';

        if (this.searchForm.value.searchColumn! == 'DocumentTypeId') {
            searchTerm = String(this.searchForm.value.documentTypeId);
            searchTerm2 = this.searchForm.value.searchTerm!;
        } else {
            searchTerm = this.searchForm.value.searchTerm!;
            if (searchTerm == '') searchTerm = ' ';
        }

        this.service.getSearch(
            this.pageIndex(),
            this.pageSize(), searchTerm, searchTerm2, this.searchForm.value.searchColumn!, this.natural
        )
            .pipe(finalize(() => this.profileStore.setLoading(false)))
            .subscribe({
                next: response => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.profileStore.set(data);
                    this.profileStore.setPagination(totalRecords, this.pageIndex(), this.pageSize());
                    this.updateDataSource();
                }
            });
    }


    private updateDataSource(): void {
        this.dataSource.data = this.profileStore.items() ?? [];
    }

    goBack(): void {
        this.dialogRef.close();
    }

    selectedProfile(profile: Profile) {
        this.store.setProfile(profile);
        this.dialogRef.close(true);
    }

}
