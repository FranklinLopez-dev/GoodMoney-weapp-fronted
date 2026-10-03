import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ExportadorReportesService } from 'src/app/shared/services/exportador-reportes.service';

/** Va dentro de un contenedor `.gm-acciones`: el host no genera caja para que los botones sean hijos directos del flex. */
@Component({
    selector: 'app-botones-exportar',
    standalone: true,
    imports: [MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, TablerIconsModule],
    host: { style: 'display: contents' },
    template: `
    <button mat-flat-button type="button" class="bg-success text-white"
        matTooltip="Exportar a Excel según los filtros"
        [disabled]="deshabilitado || !!exportador.enCurso()" (click)="excel.emit()">
        @if (exportador.enCurso() === 'excel') {
        <mat-spinner diameter="18"></mat-spinner>
        } @else {
        <i-tabler name="file-type-xls" class="icon-18"></i-tabler>
        }
        Excel
    </button>
    <button mat-flat-button type="button" class="bg-error text-white"
        matTooltip="Exportar a PDF según los filtros"
        [disabled]="deshabilitado || !!exportador.enCurso()" (click)="pdf.emit()">
        @if (exportador.enCurso() === 'pdf') {
        <mat-spinner diameter="18"></mat-spinner>
        } @else {
        <i-tabler name="file-type-pdf" class="icon-18"></i-tabler>
        }
        PDF
    </button>
    `
})
export class BotonesExportarComponent {
    @Input() deshabilitado = false;
    @Output() excel = new EventEmitter<void>();
    @Output() pdf = new EventEmitter<void>();

    protected exportador = inject(ExportadorReportesService);
}
