import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { AmountInputDirective } from 'src/app/shared/directives/amount-input.directive';

@Component({
  standalone: true,
  selector: 'app-edit-amount-dialog',
  templateUrl: './edit-amount-dialog.component.html',
  styleUrls: ['./edit-amount-dialog.component.scss'],
  imports: [MaterialModule, AmountInputDirective, ReactiveFormsModule]
})
export class EditAmountDialogComponent {

  form = this.fb.group({
    amount: [
      this.data.initialAmount,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.data.maxAmount)
      ]
    ]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditAmountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title?: string;
      currency: 'PEN' | 'USD';
      maxAmount: number;
      initialAmount: number;
      banco: string,
      accountNumber: string
    }
  ) {}

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.amount);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

}
