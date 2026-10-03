import { Injectable, inject } from '@angular/core';
import { AsistenteFaqsService } from './asistente-faqs.service';

@Injectable({ providedIn: 'root' })
export class AsistenteFaqsResolver {

    private service = inject(AsistenteFaqsService);

    resolve() {
        return this.service.getAll();
    }
}
