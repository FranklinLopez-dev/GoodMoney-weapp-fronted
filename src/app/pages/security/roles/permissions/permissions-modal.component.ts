import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Roles } from 'src/app/core/models';
import { PermissionsService } from './permissions.service';
import { MaterialModule } from 'src/app/material.module';
import { Permissions } from 'src/app/core/models/security/permissions.model';
import { RolesService } from '../roles.service';

@Component({
    selector: 'app-permissions-modal',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule
    ],
    template: `
    <div class="permissions-modal">
        <h2 mat-dialog-title>Asignar Permisos - {{ roleName }}</h2>

        @if(loading) {
        <div class="d-flex justify-content-center align-items-center" style="min-height:400px">
            <mat-spinner diameter="40"></mat-spinner>
        </div>
        } @else {
        <mat-dialog-content>

            <mat-checkbox [checked]="allChecked" [indeterminate]="someChecked && !allChecked" (change)="toggleAll($event)">
            Seleccionar/Deseleccionar todos
            </mat-checkbox>

            <div class="m-l-24">
            @for(permission of permissions; track permission.id) {
            <div class="permission-item">
                <mat-checkbox [formControl]="getPermissionControl(permission.id)">
                @if(permission.description) {
                <span>{{ permission.description }}</span>
                }
                </mat-checkbox>
            </div>
            }
            </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="cancel()">Cancelar</button>
            <button mat-flat-button color="primary" (click)="save()" [disabled]="savingLoading">
            @if(savingLoading) {
            <mat-spinner diameter="20"></mat-spinner>
            } @else {
            Guardar
            }
            </button>
        </mat-dialog-actions>
        }
        </div>
  `,
    styles: [`
    .permissions-modal mat-checkbox {
      --mat-checkbox-selected-icon-color: #000;
      --mat-checkbox-selected-hover-icon-color: #000;
      --mat-checkbox-selected-focus-icon-color: #000;
      --mat-checkbox-selected-pressed-icon-color: #000;
      --mat-checkbox-selected-checkmark-color: #fff;
    }
  `]
})
export class PermissionsModalComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<PermissionsModalComponent>);
    private permissionsService = inject(PermissionsService);
    private rolesService = inject(RolesService);
    private fb = inject(FormBuilder);
    private toastr = inject(ToastrService);

    roleName = '';
    permissions: Permissions[] = [];
    loading = true;
    savingLoading = false;
    form!: FormGroup;
    rolePermissions: Set<string> = new Set();

    get allChecked(): boolean {
        return this.permissions.length > 0 &&
            this.permissions.every(p => this.getPermissionControl(p.id).value);
    }

    get someChecked(): boolean {
        return this.permissions.some(p => this.getPermissionControl(p.id).value);
    }

    constructor(@Inject(MAT_DIALOG_DATA) public data: { role: Roles }) { }

    ngOnInit(): void {
        this.roleName = this.data.role.name;
        this.initializeForm();
        this.loadData();
    }

    private initializeForm(): void {
        this.form = this.fb.group({});
    }

    private loadData(): void {
        forkJoin({
            allPermissions: this.permissionsService.getAll(),
            rolePermissions: this.rolesService.getPermissions(this.data.role.id),
        })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: ({ allPermissions, rolePermissions }) => {
                    this.permissions = allPermissions;

                    this.rolePermissions = new Set(
                        rolePermissions.map(p => p.type)
                    );

                    this.permissions.forEach(permission => {
                        const isAssigned = this.rolePermissions.has(permission.nameClaim);
                        this.form.addControl(
                            String(permission.id),
                            this.fb.control(isAssigned)
                        );
                    });

                }
            });
    }

    getPermissionControl(permissionId: number | string) {
        return this.form.get(String(permissionId)) as any;
    }

    toggleAll(event: any): void {
        const isChecked = event.checked;
        this.permissions.forEach(permission => {
            this.form.get(String(permission.id))?.setValue(isChecked, { emitEvent: false });
        });
    }

    save(): void {
        this.savingLoading = true;

        const selectedPermissions = this.permissions.filter(permission =>
            this.form.get(String(permission.id))?.value
        );

        this.permissionsService.saveRolePermissions(this.data.role.id, selectedPermissions)
            .pipe(finalize(() => this.savingLoading = false))
            .subscribe({
                next: () => {
                    this.toastr.success('Permisos guardados exitosamente');
                    this.dialogRef.close(true);
                }
            });
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
