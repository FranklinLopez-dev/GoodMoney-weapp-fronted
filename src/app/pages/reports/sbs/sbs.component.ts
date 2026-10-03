import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MonthPickerComponent } from 'src/app/shared/components/month-picker/month-picker.component';

import { SBS } from 'src/app/core/models';
import { OperationsService } from '../../operations/operations.service';
import { SBSStore } from './sbs.store';
import { ReporteMensual } from '../reporte-mensual.base';

@Component({
    selector: 'reports-sbs',
    standalone: true,
    templateUrl: './sbs.component.html',
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        MonthPickerComponent,
    ],
})
export class SbsComponent extends ReporteMensual<SBS> {

    protected store = inject(SBSStore);
    private operationService = inject(OperationsService);

    protected consultar(anio: number, mes: number): Observable<SBS[]> {
        return this.operationService.getSBS(anio, mes);
    }

    descargarExcel(): void {
        // lo conectas luego con el endpoint real
    }
}
