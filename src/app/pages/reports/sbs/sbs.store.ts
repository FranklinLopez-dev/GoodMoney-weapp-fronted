import { Injectable } from '@angular/core';
import { SBS } from 'src/app/core/models';
import { ListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class SBSStore extends ListStore<SBS> {}
