import { Routes } from '@angular/router';
import { Permission } from 'src/app/core/auth/permissions.enum';
import { SupportComponent } from './support.component';

export const SupportRoutes: Routes = [
  {
    path: '',
    component: SupportComponent,
    data: {
      title: 'Soporte',
      permission: Permission.SupportIndex,
      urls: [{ title: 'Soporte' }],
    },
  },
];
