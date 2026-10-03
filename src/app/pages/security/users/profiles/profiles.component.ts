import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { Component, computed, inject } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Profile } from 'src/app/core/models';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { environment } from 'src/environments/environment';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { conPausaDeTipeo } from 'src/app/shared/utils/busqueda-backend';
import { ToastrService } from 'ngx-toastr';
import { ProfilesUserStore } from './profiles.store';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'app-profiles',
    standalone: true,
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        FallbackImgDirective,
        ReactiveFormsModule
    ],
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent {

    private store = inject(ProfilesUserStore);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private service = inject(ProfilesService);
    searchControl = new FormControl('');
    public baseUrl = environment.apiUrl;

    loading = this.store.loading;
    changingProfile = false;
    user = computed(() => this.store.user());
    pageIndex = computed(() => this.store.pageIndex());
    currentId = computed(() => this.store.currentId());
    profiles = computed<Profile[]>(() => this.store.items() ?? []);
    length = computed(() => this.store.totalRecords());
    pageSize = computed(() => PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

    constructor(private toastr: ToastrService) {
        this.searchControl.valueChanges
            .pipe(conPausaDeTipeo(), takeUntilDestroyed())
            .subscribe(() => this.cargarData());
    }

    getProfileType(profile: Profile): string {
        return profile.documentTypeIsNatural
            ? 'Perfil Natural'
            : 'Perfil Jurídico';
    }

    cargarData() {
        this.store.setPagination(this.length(), PAGINATION_CONFIG.DEFAULT_PAGE_INDEX);
        this.loadData();
    }

    loadData(): void {
        this.store.setLoading(true);
        const searchTerm = this.searchControl.value ?? '';

        this.service.getAllId(
            searchTerm,
            this.pageIndex(),
            this.currentId()!
        )
            .pipe(finalize(() => this.store.setLoading(false)))
            .subscribe({
                next: response => {
                    const data = response.body ?? [];

                    const totalRecords = totalDelEncabezado(response.headers);

                    this.store.set(this.currentId()!, data);
                    this.store.setPagination(totalRecords, this.pageIndex());
                }
            });
    }

    onPageChange(event: PageEvent): void {
        this.store.setPagination(event.length, event.pageIndex);
        this.loadData();
    }

    update(profile: Profile) {

        if (this.changingProfile) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: (profile.isValidate ? 'Deshabilitar' : 'Habilitar') + ' perfil',
                message: '¿Seguro que deseas ' + (profile.isValidate ? 'deshabilitar' : 'habilitar') + ' este perfil ' + profile.names + '?',
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.changingProfile = true;

                let payload = JSON.parse(JSON.stringify(profile));
                payload.isValidate = !payload.isValidate;

                this.service.updateProfile(payload)
                    .pipe(finalize(() => {
                        this.changingProfile = false;
                    }))
                    .subscribe({
                        next: (rs) => {
                            if (rs == 'OK') {
                                this.toastr.success('Perfil ' + (profile.isValidate ? 'deshabilitado' : 'habilitado') + ' correctamente', 'Éxito');
                                profile.isValidate = !profile.isValidate;
                            } else {
                                this.toastr.warning(rs, 'Advertencia');
                            }

                        }
                    });
            },
        });
    }

    isAdminWithIndividualProfile(profile: Profile): boolean {
        const user = this.user();

        if (!user || !user.roles) return false;

        const isAdmin = user.roles.some(
            role => role.normalizedName === 'ADMINISTRADOR'
        );

        return isAdmin && profile.isFormIndividual === false;
    }

    editProfile(profile: Profile) {
        if (!profile?.id) return;
        
        this.store.setCurrent(profile, this.currentId()!);
        this.router.navigate(['/security/users', this.currentId(), profile.id]);
    }
}
