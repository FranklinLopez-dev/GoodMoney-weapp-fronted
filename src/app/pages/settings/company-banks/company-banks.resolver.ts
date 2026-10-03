import { inject, Injectable } from "@angular/core";
import { forkJoin, tap } from "rxjs";
import { CompanyBanksService } from "./company-banks.service";
import { CompanyBanksStore } from "./company-banks.store";
import { BanksService } from "../banks/banks.service";
import { BanksStore } from "../banks/banks.store";

@Injectable({ providedIn: 'root' })
export class CompanyBanksResolver {
  private service = inject(CompanyBanksService);
  private banksService = inject(BanksService);
  private store = inject(CompanyBanksStore);
  private bankStore = inject(BanksStore);

  resolve() {
    return forkJoin({
      companyBanks: this.service.getAll(),
      banks: this.banksService.getAll()
    }).pipe(
      tap(({ companyBanks, banks }) => {
        this.store.set(companyBanks);
        this.bankStore.set(banks);
      })
    );
  }
}
