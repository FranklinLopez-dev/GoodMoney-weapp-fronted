import { Injectable, inject } from '@angular/core';
import { SeasonalLogosService } from './seasonal-logos.service';

@Injectable({ providedIn: 'root' })
export class SeasonalLogosResolver {

    private service = inject(SeasonalLogosService);

    resolve() {
        return this.service.getAll();
    }
}
