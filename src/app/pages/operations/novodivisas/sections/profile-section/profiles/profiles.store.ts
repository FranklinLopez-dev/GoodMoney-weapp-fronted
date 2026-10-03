import { Injectable } from '@angular/core';
import { Profile } from 'src/app/core/models';
import { PagedListStore } from 'src/app/core/stores/crud.store';

@Injectable({ providedIn: 'root' })
export class ProfilesStore extends PagedListStore<Profile> {}
