import { Component, inject, Inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { Users } from 'src/app/core/models';
import { UsersService } from './users.service';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-activities-dialog',
    standalone: true,
    imports: [
        MaterialModule,
        ReactiveFormsModule
    ],
    template: `
    <h2 mat-dialog-title>Cambiar correo</h2>
    <form [formGroup]="form" class="p-24">
        
        <mat-form-field appearance="outline" class="w-100">
            <mat-label>Correo electrónico</mat-label>
            <input type="email" matInput formControlName="email" />
        </mat-form-field>

    </form>
    <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Guardando...' : 'Guardar' }}
        </button>
    </mat-dialog-actions>
  `
})
export class UserEmailDialogComponent {

    private service = inject(UsersService);
    private toastr = inject(ToastrService);
    private dialog = inject(MatDialog);

    form = this.fb.nonNullable.group({
        email: [null, [Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Validators.required]],
    });

    get control() {
        return this.form.controls;
    }

    loading = signal(false);

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<UserEmailDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Users
    ) { }

    save(): void {
        if (this.form.invalid || this.loading()) return;

        this.dialogRef.addPanelClass('dialog-panel-hidden-behind-confirm');

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Cambiar coreo',
                message: `¿Estás seguro que deseas cambiar el correo del usuario ${this.data.names}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) {
                    this.dialogRef.removePanelClass('dialog-panel-hidden-behind-confirm');
                    return;
                }

                this.loading.set(true);

                const previousValue = this.data.email;
                this.data.email = this.form.value.email!;

                this.service.changeEmail(this.data)
                    .pipe(finalize(() => {
                        this.loading.set(false);
                    }))
                    .subscribe({
                        next: () => {
                            this.toastr.success('Se cambio el correo, electrónico, importamte volver a validar');
                            this.dialogRef.close(this.data);
                        },
                        error: () => {
                            this.data.email = previousValue;
                            this.dialogRef.removePanelClass('dialog-panel-hidden-behind-confirm');
                        }
                    });
            },
        });

    }

    cancel(): void {
        this.dialogRef.close(null);
    }

}
