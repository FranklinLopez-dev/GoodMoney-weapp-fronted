import { inject, Injectable } from "@angular/core";
import { Roles } from "src/app/core/models";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { RolesService } from "./roles.service";
import { RolesStore } from "./roles.store";

@Injectable({ providedIn: 'root' })
export class RolesResolver extends CatalogoResolver<Roles> {
  protected service = inject(RolesService);
  protected store = inject(RolesStore);
}
