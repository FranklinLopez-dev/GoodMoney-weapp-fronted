import { Component, computed, inject } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfilesStore } from '../../profiles.store';
import { Profile, Profiles } from 'src/app/core/models';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { environment } from 'src/environments/environment';
import { ProfilesService } from '../../profiles.service';
import { finalize } from 'rxjs';
import { UtilsService } from 'src/app/core/services/common/utils.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
    selector: 'app-profiles',
    standalone: true,
    imports: [ArchivoPrivadoPipe, AsyncPipe, 
        MaterialModule,
        TablerIconsModule,
        FallbackImgDirective
    ],
    templateUrl: './profiles.component.html',
    styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent {

    private store = inject(ProfilesStore);
    private service = inject(ProfilesService);
    private utilsService = inject(UtilsService);
    public baseUrl = environment.apiUrl;
    private router = inject(Router);

    loading = this.store.loading;
    changingProfile = false;

    profiles = computed<Profiles[]>(() => this.store.items() ?? []);

    constructor(private toastr: ToastrService) {
    }

    getProfileType(profile: Profile): string {
        return profile.documentTypeIsNatural
            ? 'Perfil Natural'
            : 'Perfil Jurídico';
    }

    toggleProfile(profile: Profile, event: MatSlideToggleChange): void {
        if (!event.checked) {
            // El perfil activo no se apaga: se cambia encendiendo otro.
            event.source.checked = true;
            return;
        }
        this.selectProfile(profile);
    }

    selectProfile(profile: Profile): void {
        if (this.changingProfile) return;

        this.changingProfile = true;

        this.service.changeSelectedProfile(profile.id)
            .pipe(finalize(() => {
                this.changingProfile = false;
            }))
            .subscribe({
                next: () => {
                    this.profiles().forEach(p => {
                        p.profile.flagCheck = p.profile.id === profile.id;
                    });

                    this.toastr.success('Perfil seleccionado correctamente', 'Éxito');
                    this.utilsService.setProfile(profile);
                    this.router.navigate(['/operations/create'])
                }
            });
    }


    editProfile(profile: Profile) {
        if (!profile?.id) return;
        this.store.setCurrent(profile);
        this.router.navigate(['/profiles', profile.id]);
    }

    createProfile(): void {
        this.store.setCurrent(null);
        this.router.navigate(['/profiles', 'new']);
    }

}
