import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { BlockingModalData } from './blocking-modal.models';

@Component({
  selector: 'app-blocking-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MaterialModule],
  templateUrl: './blocking-modal.component.html',
  styleUrls: ['./blocking-modal.component.scss'],
})
export class BlockingModalComponent {
  private dialogRef = inject(MatDialogRef<BlockingModalComponent>);
  readonly data = inject<BlockingModalData>(MAT_DIALOG_DATA);

  close(result: 'primary' | 'secondary' | 'close' = 'close'): void {
    this.dialogRef.close(result);
  }

  get iconName(): string {
    switch (this.data.kind) {
      case 'maintenance': return 'build_circle';
      case 'closed': return 'schedule';
      case 'profile': return 'verified_user';
      default: return 'info';
    }
  }

  get tone(): 'danger' | 'warning' | 'info' {
    switch (this.data.kind) {
      case 'maintenance': return 'danger';
      case 'closed': return 'warning';
      case 'profile': return 'info';
      default: return 'info';
    }
  }
}
