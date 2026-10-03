import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { AuditoriumsService } from "./auditoriums.service";
import { AuditoriumsStore } from "./auditoriums.store";
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Injectable({ providedIn: 'root' })
export class AuditoriumsResolver {
    private service = inject(AuditoriumsService);
    private store = inject(AuditoriumsStore);

    resolve() {
        const today = aFechaApi(new Date());
        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        return this.service.search(pageIndex, pageSize, today, today).pipe(
            tap((response) => {
                const data = response.body ?? [];
                const totalRecords = totalDelEncabezado(response.headers);
                this.store.set(data);
                this.store.setPagination(totalRecords, pageIndex, pageSize);
            })
        );
    }
}
