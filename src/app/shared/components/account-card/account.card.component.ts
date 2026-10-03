import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ProfileBanks } from "src/app/core/models/profiles/profile-banks.model";
import { MaterialModule } from "src/app/material.module";

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './account-card.component.html',
  styleUrls: ['./account-card.component.scss']
})
export class AccountCardComponent {
  @Input() account!: ProfileBanks | null;
  @Input() currency!: 'PEN' | 'USD';
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();

  get displayAccountNumber(): string {
    if (!this.account) {
      return '**** XXXX';
    }

    const isOnlyZeros = (value?: string) =>
      !value || /^0+$/.test(value);

    if (!isOnlyZeros(this.account.accountNumber)) {
      return 'Cuenta: **** ' + this.account.accountNumber.slice(-4);
    }

    if (!isOnlyZeros(this.account.accountNumberCci)) {
      return 'CCI: **** ' + this.account.accountNumberCci.slice(-4);
    }

    return '**** XXXX';
  }

}
