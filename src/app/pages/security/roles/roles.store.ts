import { Injectable } from '@angular/core';
import { Roles } from 'src/app/core/models';
import { CrudStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class RolesStore extends CrudStore<Roles, string> {}
