import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MaterialModule } from "src/app/material.module";

@Component({
  standalone: true,
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title>Vista previa</h2>
    <mat-dialog-content style="height:70vh">
      <iframe
        [srcdoc]="html"
        sandbox=""
        style="width:100%;height:100%;border:none">
      </iframe>
    </mat-dialog-content>
  `
})
export class EmailsPreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public html: string) {}
}
