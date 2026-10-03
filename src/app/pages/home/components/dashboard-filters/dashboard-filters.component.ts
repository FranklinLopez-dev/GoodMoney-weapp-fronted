import { aFechaApi } from 'src/app/shared/utils/fechas';
import { Component, inject } from '@angular/core';
import { DashboardStore } from '../../store/dashboard.store';
import { MaterialModule } from 'src/app/material.module';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { MonthPickerComponent } from 'src/app/shared/components/month-picker/month-picker.component';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';

@Component({
    selector: 'app-dashboard-filters',
    standalone: true,
    imports: [MaterialModule, ReactiveFormsModule, DateMaskDirective, MonthPickerComponent],
    templateUrl: './dashboard-filters.component.html'
})
export class DashboardFiltersComponent {

    private store = inject(DashboardStore);
    private fb = inject(FormBuilder);

    form: FormGroup = this.fb.group({
        filterType: [3, Validators.required],
        month: [new Date(), Validators.required],
        fromMonth: [null],
        toMonth: [null],
        date: [null],
        fromDate: [null],
        toDate: [null],
    },
        {
            validators: [
                rangeValidator('fromMonth', 'toMonth', 'month'),
                rangeValidator('fromDate', 'toDate', 'date')
            ]
        }
    );

    get control() {
        return this.form.controls;
    }

    get month() {
        return this.form.controls['month'] as FormControl;
    }

    get toMonth() {
        return this.form.controls['toMonth'] as FormControl;
    }

    get fromMonth() {
        return this.form.controls['fromMonth'] as FormControl;
    }

    constructor() {
        this.handleFilterChanges();
    }

    handleFilterChanges() {
        this.form.get('filterType')!.valueChanges.subscribe(type => {
            ['month', 'fromMonth', 'toMonth', 'date', 'fromDate', 'toDate']
                .forEach(c => {
                    this.form.get(c)!.clearValidators();
                    this.form.get(c)!.setValue(null);
                });

            const now = new Date();

            switch (type) {
                case 3:
                    this.form.get('month')!.setValidators(Validators.required);
                    this.form.patchValue({ month: now });
                    break;

                case 4:
                    this.form.get('fromMonth')!.setValidators(Validators.required);
                    this.form.get('toMonth')!.setValidators(Validators.required);
                    this.form.patchValue({
                        fromMonth: new Date(now.getFullYear(), 0, 1),
                        toMonth: new Date(now.getFullYear(), 11, 1)
                    });
                    break;

                case 5:
                    this.form.patchValue({ date: now });
                    break;

                case 6:
                    this.form.get('fromDate')!.setValidators(Validators.required);
                    this.form.get('toDate')!.setValidators(Validators.required);
                    this.form.patchValue({
                        fromDate: new Date(now.getFullYear(), now.getMonth(), 1),
                        toDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    });
                    break;
            }
            this.form.updateValueAndValidity();
        });
    }

    apply() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const v = this.form.value;
        let extra: any = {};

        switch (v.filterType) {
            case 3:
                extra.month = aFechaApi(new Date(v.month));
                break;

            case 4:
                extra.fromMonth = aFechaApi(new Date(v.fromMonth));
                extra.toMonth = aFechaApi(new Date(v.toMonth));
                break;

            case 5:
                extra.date = aFechaApi(new Date(v.date));
                break;

            case 6:
                extra.fromDate = aFechaApi(new Date(v.fromDate));
                extra.toDate = aFechaApi(new Date(v.toDate));
                break;
        }

        this.store.updateFilters(v.filterType, 1, extra);
    }

}
