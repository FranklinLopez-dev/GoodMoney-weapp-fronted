import { Injectable } from '@angular/core';
import { Auditoriums } from 'src/app/core/models';
import { PagedListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class AuditoriumsStore extends PagedListStore<Auditoriums> {}
