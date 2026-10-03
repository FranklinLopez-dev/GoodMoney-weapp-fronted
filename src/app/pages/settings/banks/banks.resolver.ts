import { inject, Injectable } from "@angular/core";
import { Banks } from "src/app/core/models";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { BanksService } from "./banks.service";
import { BanksStore } from "./banks.store";

@Injectable({ providedIn: 'root' })
export class BanksResolver extends CatalogoResolver<Banks> {
  protected service = inject(BanksService);
  protected store = inject(BanksStore);
}
