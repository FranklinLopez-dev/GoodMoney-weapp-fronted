import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { NovodivisasStore } from '../../novodivisas.store';
import { AmountInputDirective } from 'src/app/shared/directives/amount-input.directive';

@Component({
    selector: 'app-simulation-section',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        AmountInputDirective
    ],
    templateUrl: './simulation-section.component.html',
    styleUrls: ['./simulation-section.component.scss']
})
export class SimulationSectionComponent implements OnInit, AfterViewInit {

    @ViewChild('amountUsdInput') amountUsdInput!: ElementRef<HTMLInputElement>;
    @ViewChild('amountPenInput') amountPenInput!: ElementRef<HTMLInputElement>;
    @ViewChild('exchangeRateInput') exchangeRateInput!: ElementRef<HTMLInputElement>;
    @Input({ required: true }) form!: FormGroup;
    @Output() moveToDocument = new EventEmitter<void>();

    private store = inject(NovodivisasStore);
    readonly table = this.store.table;

    exchangeRate = this.table()?.exchangeRate;

    ngOnInit(): void {

        queueMicrotask(() => {
            this.recalculateFromUsd();
        })

        // guardamos el form en el store (como venimos haciendo)
        this.bindCalculations();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.amountUsdInput?.nativeElement.focus();
            this.amountUsdInput?.nativeElement.select(); // opcional: selecciona el valor 1000
        });
    }

    focusExchangeRate(): void {
        setTimeout(() => {
            this.exchangeRateInput?.nativeElement.focus();
            this.exchangeRateInput?.nativeElement.select();
        });
    }

    focusAmountPen(): void {
        setTimeout(() => {
            this.amountPenInput?.nativeElement.focus();
            this.amountPenInput?.nativeElement.select();
        });
    }

    goToDocumentNumber(): void {
        this.moveToDocument.emit();
    }

    private bindCalculations(): void {

        this.form.get('exchangeRate')!.valueChanges.subscribe((value) => {
            this.recalculateExchange(value);
        });

        this.form.get('amountUsd')!.valueChanges.subscribe((value) => {
            this.recalculateFromUsd(value);
        });

        this.form.get('amountPen')!.valueChanges.subscribe((value) => {
            this.recalculateFromPen(value);
        });

        this.form.get('exchange')!.valueChanges.subscribe((value) => {
            this.form.get('exchangeRate')!.setValue(value === '1' ? this.exchangeRate?.priceCompra : this.exchangeRate?.priceVenta);
        });

    }

    get control() {
        return this.form.controls;
    }

    private recalculateExchange(value: number): void {
        const pen = Number(this.form.value.amountUsd) * value;
        this.form.get('amountPen')!.setValue(this.round(pen), { emitEvent: false });
    }

    private recalculateFromUsd(value?: number): void {
        const rate = this.form.value.exchangeRate;
        const pen = Number(value ?? this.form.value.amountUsd) * rate;
        this.form.get('amountPen')!.setValue(this.round(pen), { emitEvent: false });
    }

    private recalculateFromPen(value?: number): void {
        const rate = this.form.value.exchangeRate;
        const usd = Number(value ?? this.form.value.amountPen) / rate;
        this.form.get('amountUsd')!.setValue(this.round(usd), { emitEvent: false });
    }


    swapAmounts(): void {
        const current = this.form.value.typeOperation;
        this.form.get('typeOperation')!.setValue(current === 'BUY' ? 'SELL' : 'BUY');
        this.recalculateFromUsd();
    }

    cambiarCabezera() {
        if (this.control['typeOperation'].value == '1') {
            this.control['exchange'].setValue('1');
        } else {
            this.control['exchange'].setValue('2');
        }
    }

    private round(v: number): number {
        return Number(v.toFixed(2));
    }

}
