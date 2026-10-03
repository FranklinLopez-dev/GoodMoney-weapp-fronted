import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CompanyService } from '../company/company.service';
import { Company } from 'src/app/core/models';

/** El API guarda la empresa entera (`SetValues`): se carga la ficha completa y se devuelve intacta en el resto. */
@Component({
    selector: 'app-operation-rules',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, TablerIconsModule],
    templateUrl: './operation-rules.component.html',
    styleUrls: ['./operation-rules.component.scss'],
})
export class OperationRulesComponent {

    private fb = inject(FormBuilder);
    private service = inject(CompanyService);
    private toastr = inject(ToastrService);

    readonly guardando = signal(false);
    readonly cargando = signal(true);

    /** La ficha completa tal cual llegó, para no perder nada al guardar. */
    private empresa: Company | null = null;

    form = this.fb.group({
        quoteMinutes: [5, [Validators.required, Validators.min(1), Validators.max(60)]],
        operationTime: [20, [Validators.required, Validators.min(1)]],
        minAmount: [0, [Validators.required, Validators.min(0)]],
        maxAmount: [0, [Validators.required, Validators.min(0)]],
        monthlyChange: [0, [Validators.min(0)]],
        isOneAccount: [false],
        isDuplicated: [false],
        allowOperationsOutsideHours: [true],
        isMaintenance: [false],
        isClosed: [false],
    });

    constructor() {
        this.service.get()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe(empresa => {
                this.empresa = empresa;
                this.form.patchValue(empresa as any);
            });
    }

    guardar(): void {
        if (this.form.invalid || this.guardando() || !this.empresa) {
            this.form.markAllAsTouched();
            return;
        }

        const valores = this.form.getRawValue();

        if ((valores.maxAmount ?? 0) > 0 && (valores.minAmount ?? 0) > (valores.maxAmount ?? 0)) {
            this.toastr.warning('El monto mínimo no puede ser mayor que el máximo.', 'Revisa los montos');
            return;
        }

        this.guardando.set(true);

        this.service.update({ ...this.empresa, ...valores } as any)
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => this.toastr.success('Reglas actualizadas', 'Listo'),
                error: () => this.toastr.error('No se pudieron guardar las reglas'),
            });
    }
}
