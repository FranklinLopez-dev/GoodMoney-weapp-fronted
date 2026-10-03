import { Injectable } from '@angular/core';
import { Activities } from 'src/app/core/models';
import { CrudStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class ActivitiesStore extends CrudStore<Activities> {}
