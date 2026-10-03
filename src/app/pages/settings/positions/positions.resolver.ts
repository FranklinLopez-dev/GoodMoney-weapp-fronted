import { inject, Injectable } from "@angular/core";
import { Positions } from "src/app/core/models";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { PositionsService } from "./positions.service";
import { PositionsStore } from "./positions.store";

@Injectable({ providedIn: 'root' })
export class PositionsResolver extends CatalogoResolver<Positions> {
  protected service = inject(PositionsService);
  protected store = inject(PositionsStore);
}
