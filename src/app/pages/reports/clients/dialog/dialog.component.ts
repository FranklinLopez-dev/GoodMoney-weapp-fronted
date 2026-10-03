import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { startOfDay } from 'date-fns';
import { Users } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { rangeValidator } from 'src/app/shared/validators/date-range.validators';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'client-dialog',
    imports: [
        MaterialModule,
        TablerIconsModule,
        ReactiveFormsModule,
        DateMaskDirective
    ],
    templateUrl: './dialog.component.html'
})
export class ClientDialogComponent {

    public readonly baseUrl = environment.apiUrl;

    searchForm = this._formBuilder.group({
        fromDate: [startOfDay(new Date()), Validators.required],
        toDate: [startOfDay(new Date()), Validators.required]
    },
        {
            validators: [
                rangeValidator('fromDate', 'toDate', 'date')
            ]
        }
    );

    get control() {
        return this.searchForm.controls;
    }

    constructor(
        private _formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<ClientDialogComponent>,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public client: Users
    ) { }

    goBack(): void {
        this.dialogRef.close();
    }

    generarPdf() {
        if (this.searchForm.invalid) return;
        this.dialogRef.close(this.searchForm.value);
    }

}
