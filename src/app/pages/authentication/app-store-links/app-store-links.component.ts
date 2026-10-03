import { Component, Input, signal, computed, inject } from '@angular/core';
import { AuthCompanyStore } from '../auth-company.store';

@Component({
  selector: 'app-app-store-links',
  standalone: true,
  templateUrl: './app-store-links.component.html'
})
export class AppStoreLinksComponent {

  private companyStore = inject(AuthCompanyStore);

  company = this.companyStore.company;
  appIosUrl = this.companyStore.appIosUrl;
  appAndroidUrl = this.companyStore.appAndroidUrl;

  readonly showCard = computed(() => !!this.appIosUrl() && !!this.appAndroidUrl());
}
