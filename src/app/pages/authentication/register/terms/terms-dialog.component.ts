import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-terms-dialog',
  templateUrl: './terms-dialog.component.html',
  standalone: true,
  imports: [MaterialModule]
})
export class TermsDialogComponent {

  constructor(private dialogRef: MatDialogRef<TermsDialogComponent>) {}

  close(): void {
    this.dialogRef.close(false);
  }

  accept(): void {
    this.dialogRef.close(true);
  }
}
