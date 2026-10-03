import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { EmailsStore } from "./emails.store";
import { MatTableDataSource } from "@angular/material/table";
import { EmailTemplate } from "src/app/core/models/settings/email.model";
import { EmailsDialogComponent } from "./emails-dialog.component";
import { EmailsService } from "./emails.service";
import { finalize } from "rxjs";

@Component({
  standalone: true,
  selector: 'app-emails',
  templateUrl: './emails.component.html',
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule
  ]
})
export class EmailsComponent {

  private dialog = inject(MatDialog);
  protected store = inject(EmailsStore);
  private service = inject(EmailsService);

  displayedColumns = ['code', 'subject', 'status', 'action'];
  dataSource = new MatTableDataSource<EmailTemplate>();

  loading = this.store.loading;

  constructor() {
    this.updateDataSource();
  }

  private updateDataSource(): void {
    this.dataSource.data = this.store.items() ?? [];
  }

  create() {
    this.dialog.open(EmailsDialogComponent, { width: '1240px', maxWidth: '95vw', panelClass: 'editor-correo' })
      .afterClosed().subscribe(res => res && this.reload());
  }

  edit(item: EmailTemplate) {
    this.dialog.open(EmailsDialogComponent, {
      width: '1240px',
      maxWidth: '95vw',
      panelClass: 'editor-correo',
      data: item
    }).afterClosed().subscribe(res => res && this.reload());
  }

  private reload() {
      this.store.setLoading(true);
  
      this.service.getAll()
        .pipe(finalize(() => this.store.setLoading(false)))
        .subscribe(data => {
          this.store.set(data);
          this.dataSource.data = data;
        });
    }
}
