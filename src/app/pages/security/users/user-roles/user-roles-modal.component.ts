import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Roles, Users } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { RolesService } from '../../roles/roles.service';
import { RolesStore } from '../../roles/roles.store';
import { UsersService } from '../users.service';

@Component({
    selector: 'app-user-roles-modal',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule
    ],
    template: `
  <div class="user-roles-modal">
    <h2 mat-dialog-title>Asignar Roles - {{ userName }}</h2>

    @if (loading) {
      <div class="d-flex justify-content-center align-items-center" style="min-height:300px">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else {

      <mat-dialog-content>

        <mat-checkbox
          [checked]="allChecked"
          [indeterminate]="someChecked && !allChecked"
          (change)="toggleAll($event)">
          Seleccionar / Deseleccionar todos
        </mat-checkbox>

        <div class="m-l-24">
          @for (role of roles; track role.id) {
            <div class="role-item">
              <mat-checkbox [formControl]="getRoleControl(role.id)">
                {{ role.name }}
              </mat-checkbox>
            </div>
          }
        </div>

      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="savingLoading || !hasAnyRoleSelected">
          @if (savingLoading) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Guardar
          }
        </button>
      </mat-dialog-actions>
    }
  </div>
  `
})
export class UserRolesModalComponent implements OnInit {

    private dialogRef = inject(MatDialogRef<UserRolesModalComponent>);
    private rolesService = inject(RolesService);
    private rolesStore = inject(RolesStore);
    private userService = inject(UsersService);
    private fb = inject(FormBuilder);
    private toastr = inject(ToastrService);

    userName = '';
    roles: Roles[] = [];
    loading = true;
    savingLoading = false;
    form!: FormGroup;
    userRoles = new Set<string>();

    constructor(@Inject(MAT_DIALOG_DATA) public data: { user: Users }) { }

    ngOnInit(): void {
        this.userName = this.data.user.names;
        this.initializeForm();
        this.loadRoles();
    }

    private initializeForm(): void {
        this.form = this.fb.group({});
        this.userRoles = new Set(
            (this.data.user.roles ?? []).map(r => r.id.toLowerCase())
        );
    }

    private loadRoles(): void {

        if (this.rolesStore.hasData()) {
            this.roles = this.rolesStore.items()!;
            this.buildControls();
            this.loading = false;
            return;
        }

        this.rolesStore.setLoading(true);

        this.rolesService.getAll()
            .pipe(finalize(() => {
                this.rolesStore.setLoading(false);
                this.loading = false;
            }))
            .subscribe({
                next: roles => {
                    this.rolesStore.set(roles);
                    this.roles = roles;
                    this.buildControls();
                }
            });
    }

    private buildControls(): void {
        this.roles.forEach(role => {
            this.form.addControl(
                String(role.id),
                new FormControl(this.userRoles.has(String(role.id)))
            );
        });
    }

    getRoleControl(roleId: string): FormControl {
        return this.form.get(String(roleId)) as FormControl;
    }

    get allChecked(): boolean {
        return this.roles.length > 0 &&
            this.roles.every(r => this.getRoleControl(r.id)?.value === true);
    }

    get someChecked(): boolean {
        return this.roles.some(r => this.getRoleControl(r.id)?.value === true);
    }

    toggleAll(event: any): void {
        const checked = event.checked;
        this.roles.forEach(role => {
            this.getRoleControl(role.id)?.setValue(checked);
        });
    }

    save(): void {
        if (this.savingLoading) return;

        const rolesSelected = this.roles.filter(
            role => this.getRoleControl(role.id)?.value
        ).map(r => r.normalizedName);

        this.savingLoading = true;

        const payload = {
            id: this.data.user.id,
            lockoutEnabled: this.data.user.lockoutEnabled,
            roles: rolesSelected
        }

        this.userService.updateRoles(payload as any)
            .pipe(finalize(() => this.savingLoading = false))
            .subscribe({
                next: () => {
                    this.toastr.success('Roles asignados correctamente');
                    this.dialogRef.close(true);
                }
            });
    }

    cancel(): void {
        this.dialogRef.close(false);
    }

    get hasAnyRoleSelected(): boolean {
        return this.roles.some(role =>
            this.getRoleControl(role.id)?.value === true
        );
    }

}