import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { NotificationsService } from "./notifications.service";
import { NotificationsStore } from "./notifications.store";

@Injectable({ providedIn: 'root' })
export class NotificationsResolver {
    private service = inject(NotificationsService);
    private store = inject(NotificationsStore);

    resolve() {
        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        return this.service.search('', 2, pageIndex, pageSize).pipe(
            tap((response) => {
                const data = response.body ?? null;
                const totalRecords = totalDelEncabezado(response.headers);
                this.store.set(data!);
                this.store.setPagination(totalRecords, pageIndex, pageSize);
            })
        );
    }
}
