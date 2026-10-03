import { inject, Injectable } from "@angular/core";
import { Activities } from "src/app/core/models";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { ActivitiesService } from "./activities.service";
import { ActivitiesStore } from "./activities.store";

@Injectable({ providedIn: 'root' })
export class ActivitiesResolver extends CatalogoResolver<Activities> {
  protected service = inject(ActivitiesService);
  protected store = inject(ActivitiesStore);
}
