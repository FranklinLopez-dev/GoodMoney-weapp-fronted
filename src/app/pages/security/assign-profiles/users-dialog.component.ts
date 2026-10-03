import { Component, inject } from '@angular/core';
import { UsersComponent } from '../../security/users/users.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AssignProfilesStore } from './assign-profiles.store';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app--clients',
  standalone: true,
  imports: [UsersComponent, TablerIconsModule, MaterialModule],
  template: `
    <div mat-dialog-title class="d-flex align-items-center justify-content-between">
      <h3>Asignar cuenta a perfil {{profile()?.names}} </h3>
      <button mat-icon-button mat-dialog-close class="d-flex justify-content-center">
          <i-tabler name="x" class="icon-20 d-flex"></i-tabler>
      </button>
  </div>
  <mat-dialog-content>
    <app-users
      mode="profiles">
    </app-users>
  </mat-dialog-content>
  `
})
export class ClientsModalComponent {
  private profilesStore = inject(AssignProfilesStore);
  profile = this.profilesStore.profile;

}
