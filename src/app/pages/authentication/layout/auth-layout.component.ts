import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthCompanyStore } from '../auth-company.store';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  imports: [RouterOutlet, TablerIconsModule]
})
export class AuthLayoutComponent {
  year = (new Date).getFullYear();

  private companyStore = inject(AuthCompanyStore);
  // Angular ya sanea el [href]; aqui solo se admite http/https para no enlazar un `javascript:` guardado en config.
  readonly webSite: string | null;

  constructor() {
    const url = this.companyStore.webSite();
    this.webSite = url && /^https?:\/\//i.test(url) ? url : null;
  }

}
