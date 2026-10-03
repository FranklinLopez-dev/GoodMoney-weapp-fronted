import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthService } from 'src/app/core/auth/auth.service';
import { PasswordValidators } from 'src/app/shared/validators/password.validators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AssignProfilesStore } from '../assign-profiles.store';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'register-natural-admi',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule
    ],
    templateUrl: './create-natural.component.html'
})
export class CreateNaturalComponent {

    loading = signal(false);
    readonly hidePassword = signal(true);
    readonly hidePasswordConfirm = signal(true);
    private dialog = inject(MatDialog);
    private profilesStore = inject(AssignProfilesStore);
    profile = this.profilesStore.profile;

    form = this.fb.group({
        email: [this.profile()?.email, [Validators.required, Validators.email]],
        password: [null, [Validators.required, Validators.minLength(6)]],
        passwordConfirm: [null, Validators.required]
    },
        {
            validators: PasswordValidators.mustMatch("password", "passwordConfirm"),
        }
    );

    constructor(
        private toastr: ToastrService,
        private fb: FormBuilder,
        private service: AuthService,
        private dialogRef: MatDialogRef<CreateNaturalComponent>,
    ) { }

    save(): void {
        if (this.form.invalid || this.loading()) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Crear cuenta',
                message: `¿Estás seguro que deseas crear cuenta para sociar este perfil ${this.profile()?.names}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.loading.set(true);

                const payload = {
                    email: this.form.value.email,
                    password: this.form.value.password,
                    profileId: this.profile()?.id
                }

                this.service.registerNaturalAdmi(payload as any)
                    .pipe(
                        finalize(() => {
                            this.loading.set(false);
                        })
                    )
                    .subscribe({
                        next: (response: any) => {
                            if (response?.success) {
                                this.toastr.success('Cuenta creada correctamente', "Éxito");
                                this.dialogRef.close(true);
                            } else {
                                this.toastr.warning(response?.error, "Advertencia!");
                            }

                        }
                    });
            },
        });

    }

    cancel(): void {
        this.dialogRef.close(null);
    }

}
