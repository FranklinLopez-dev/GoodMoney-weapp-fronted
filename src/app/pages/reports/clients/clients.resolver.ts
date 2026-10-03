import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { UsersService } from "../../security/users/users.service";
import { UsersStore } from "../../security/users/users.store";

@Injectable({ providedIn: 'root' })
export class ClientsResolver {
    private service = inject(UsersService);
    private store = inject(UsersStore);

    resolve() {
        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        return this.service.searchClients('', pageIndex, pageSize).pipe(
            tap((response) => {
                const data = response.body ?? [];
                const totalRecords = totalDelEncabezado(response.headers);
                this.store.set(data);
                this.store.setPagination(totalRecords, pageIndex, pageSize);
            })
        );
    }
}
