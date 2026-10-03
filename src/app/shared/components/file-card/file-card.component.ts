import { Component, Input, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileViewerDialogComponent } from '../file-viewer/file-viewer-dialog.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { FileItem } from '../../model/file.model';

@Component({
  selector: 'app-file-card',
  standalone: true,
  imports: [TablerIconsModule, MaterialModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.scss'],
})
export class FileCardComponent {
  @Input({ required: true }) file!: FileItem;

  private dialog = inject(MatDialog);

  open(): void {
    this.dialog.open(FileViewerDialogComponent, {
      data: this.file,
      panelClass: this.file.type == 'PDF' ? 'file-viewer-dialog' : '',
      maxWidth: '500px',
      maxHeight: '90vh',
    });
  }
}
