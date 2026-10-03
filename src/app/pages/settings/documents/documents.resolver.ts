import { inject, Injectable } from "@angular/core";
import { DocumentType } from "src/app/core/models";
import { CatalogoResolver } from "src/app/core/resolvers/catalogo.resolver";
import { DocumentTypeStore } from "./document-type.store";
import { DocumentTypeService } from "./document-type.service";

@Injectable({ providedIn: 'root' })
export class DocumentTypeResolver extends CatalogoResolver<DocumentType> {
  protected service = inject(DocumentTypeService);
  protected store = inject(DocumentTypeStore);
}
