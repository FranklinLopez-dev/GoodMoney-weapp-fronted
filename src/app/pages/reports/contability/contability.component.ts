import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MonthPickerComponent } from 'src/app/shared/components/month-picker/month-picker.component';

import { Contability } from 'src/app/core/models';
import { OperationsService } from '../../operations/operations.service';
import { ContabilityStore } from './contability.store';
import { ReporteMensual } from '../reporte-mensual.base';

@Component({
    selector: 'reports-contability',
    standalone: true,
    templateUrl: './contability.component.html',
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        MonthPickerComponent,
    ],
})
export class ContabilityComponent extends ReporteMensual<Contability> {

    protected store = inject(ContabilityStore);
    private operationService = inject(OperationsService);

    protected consultar(anio: number, mes: number): Observable<Contability[]> {
        return this.operationService.getContability(anio, mes);
    }

    descargarExcel(): void {
        // lo conectas luego con el endpoint real
    }
}
