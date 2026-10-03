import { Component, inject } from '@angular/core';
import { CompanyStore } from './company.store';
import { CompanyReadonlyComponent } from './components/company-readonly/company-readonly.component';
import { MaterialModule } from 'src/app/material.module';
import { CompanyTabsComponent } from './components/company-tabs/company-tabs.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CompanyReadonlyComponent, MaterialModule, CompanyTabsComponent],
  templateUrl: './company.component.html'
})
export class CompanyComponent {

  public store = inject(CompanyStore);
  readonly editMode = this.store.editMode;

  ngOnDestroy() {
    this.store.reset();
  }

}
