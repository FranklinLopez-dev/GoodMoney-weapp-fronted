import { Injectable } from '@angular/core';
import { Positions } from 'src/app/core/models';
import { CrudStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class PositionsStore extends CrudStore<Positions> {}
