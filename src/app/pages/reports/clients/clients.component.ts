import { Component } from '@angular/core';
import { UsersComponent } from '../../security/users/users.component';

@Component({
  selector: 'app--clients',
  standalone: true,
  imports: [UsersComponent],
  template: `
    <app-users
      mode="clients">
    </app-users>
  `
})
export class ClientsComponent {}
