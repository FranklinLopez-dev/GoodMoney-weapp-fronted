import { Component } from '@angular/core';
import { OperationsWebComponent } from '../../operations/web/operations-web.component';

@Component({
  selector: 'app-operations-traceability',
  standalone: true,
  imports: [OperationsWebComponent],
  template: `
    <app-operations-web
      mode="traceability">
    </app-operations-web>
  `
})
export class TraceabilityComponent {}
