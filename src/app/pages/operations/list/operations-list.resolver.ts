import { aFechaApi } from 'src/app/shared/utils/fechas';
import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import { inject, Injectable } from "@angular/core";
import { tap, forkJoin, finalize } from "rxjs";
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';
import { OperationsService } from "../operations.service";
import { OperationDTO } from "src/app/core/models/operations/operations.model";
import { CompanyBanksService } from "../../settings/company-banks/company-banks.service";
import { OperationsStore } from "./operations-list.store";

const EMPTY_OPERATION_DTO: OperationDTO = {
    operations: [],
    registradas: 0,
    proceso: 0,
    finalizadas: 0,
    canceladas: 0
};

@Injectable({ providedIn: 'root' })
export class OperationsResolver {

    private service = inject(OperationsService);
    private companyBanksService = inject(CompanyBanksService);
    private store = inject(OperationsStore);

    resolve() {
        const pageIndex = PAGINATION_CONFIG.DEFAULT_PAGE_INDEX;
        const pageSize = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;
        const today = aFechaApi(new Date());

        this.store.setLoading(true);

        return forkJoin({
            operations: this.service.search(
                '2', '0', today, today, pageIndex, pageSize
            ),
            companyBanks: this.companyBanksService.getAllClient()
        }).pipe(
            tap(({ operations, companyBanks }) => {

                const data = operations.body ?? EMPTY_OPERATION_DTO;

                const totalRecords = totalDelEncabezado(operations.headers);

                this.store.set(data);
                this.store.setCompanyBanks(companyBanks);
                this.store.setPagination(totalRecords, pageIndex, pageSize);
            }),
            finalize(() => {
                this.store.setLoading(false);
            })
        );
    }
}
