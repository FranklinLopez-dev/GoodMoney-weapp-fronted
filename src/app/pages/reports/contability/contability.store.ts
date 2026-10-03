import { Injectable } from '@angular/core';
import { Contability } from 'src/app/core/models';
import { ListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class ContabilityStore extends ListStore<Contability> {}
