import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { ProfilesService } from "../../profiles/profiles.service";
import { AssignProfilesStore } from "./assign-profiles.store";

@Injectable({ providedIn: 'root' })
export class AssignProfilesResolver {
    private service = inject(ProfilesService);
    private store = inject(AssignProfilesStore);

    resolve() {
        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        return this.service.getIsFromIndividual(pageIndex, pageSize, '').pipe(
            tap((response) => {
                const data = response.body ?? [];
                const totalRecords = totalDelEncabezado(response.headers);
                this.store.set(data);
                this.store.setPagination(totalRecords, pageIndex, pageSize);
            })
        );
    }
}
