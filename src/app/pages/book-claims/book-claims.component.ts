import { Component } from '@angular/core';
import { BookClaimsComponent } from '../reports/book-claims/book-claims.component';

@Component({
  selector: 'app--clients',
  standalone: true,
  imports: [BookClaimsComponent],
  template: `
    <book-claims
      mode="clients">
    </book-claims>
  `
})
export class BookClaimsClientComponent {}
