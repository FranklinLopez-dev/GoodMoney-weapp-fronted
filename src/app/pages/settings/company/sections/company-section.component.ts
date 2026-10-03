import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { AuthStore } from 'src/app/core/auth/auth.store';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { CompanyStore } from '../company.store';
import { CompanyService } from '../company.service';
import { CompanyOperationComponent } from '../components/company-tabs/tabs/company-operation/company-operation.component';
import { CompanyEmailComponent } from '../components/company-tabs/tabs/email/email.component';

/** Comparten contenedor porque todas guardan la misma ficha, que el API actualiza entera. */
@Component({
    selector: 'app-company-section',
    standalone: true,
    imports: [
        MaterialModule,
        CompanyOperationComponent,
        CompanyEmailComponent,
    ],
    templateUrl: './company-section.component.html',
})
export class CompanySectionComponent {

    private route = inject(ActivatedRoute);
    private service = inject(CompanyService);
    private toastr = inject(ToastrService);
    private authStore = inject(AuthStore);

    readonly store = inject(CompanyStore);
    readonly guardando = signal(false);


    private datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

    /** Qué sección pinta: lo dice la ruta. */
    readonly seccion = computed(() => this.datos()?.['section'] as string);

    // La ruta solo exige *.index, así que alguien de solo lectura llega igual: el botón pide el *.update.
    readonly puedeGuardar = computed(() => this.authStore.hasPermission(Permission.BusinessUpdate));

    constructor() {
        // Estas pantallas se editan directamente: no tienen vista de solo lectura como la ficha de Empresa.
        this.store.enableEdit();
    }

    guardar(): void {
        if (this.guardando() || !this.puedeGuardar()) return;

        const empresa = this.store.company();
        if (!empresa) return;

        this.guardando.set(true);

        this.service.update(empresa)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: res => {
                    if (res === 'OK') {
                        this.toastr.success('Cambios guardados', 'Listo');
                        this.store.commitEdit();
                        // Se vuelve a habilitar: la pantalla no tiene modo lectura.
                        this.store.enableEdit();
                    }
                },
                error: () => this.toastr.error('No se pudieron guardar los cambios'),
            });
    }

}
