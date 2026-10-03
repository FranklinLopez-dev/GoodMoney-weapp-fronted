import { inject, Injectable } from "@angular/core";
import { EmailsService } from "./emails.service";
import { EmailsStore } from "./emails.store";
import { tap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class EmailsResolver {

  private service = inject(EmailsService);
  private store = inject(EmailsStore);

  resolve() {
    return this.service.getAll().pipe(
      tap(data => this.store.set(data))
    );
  }
}
