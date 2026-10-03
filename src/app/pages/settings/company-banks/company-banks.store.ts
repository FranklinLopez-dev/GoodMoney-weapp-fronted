import { Injectable } from '@angular/core';
import { CompanyBanks } from 'src/app/core/models';
import { CrudStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class CompanyBanksStore extends CrudStore<CompanyBanks> {}
