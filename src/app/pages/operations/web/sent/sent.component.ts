import { VoucherViewerService } from 'src/app/pages/operations/voucher-viewer.service';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, inject, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { OperationsService } from '../../operations.service';
import { Operation } from 'src/app/core/models/operations/operations.model';
import { finalize } from 'rxjs';
import { ProfileReadonlyComponent } from 'src/app/pages/profiles/pages/details/components/profile-readonly/profile-readonly.component';
import { Profile } from 'src/app/core/models';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';

@Component({
  selector: 'operation-create-sent',
  imports: [
    MaterialModule,
    TablerIconsModule,
    MatDividerModule,
    ClipboardModule
  ],
  templateUrl: './sent.component.html'
})
export class SentComponent {
  readonly vouchers = inject(VoucherViewerService);
  private profileService = inject(ProfilesService);
  isLoading = signal(false);

  constructor(
    private service: OperationsService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<SentComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public operation: Operation
  ) {
  }

  goBack(): void {
    this.dialogRef.close();
  }

  verPerfil(): void {
    this.profileService.getById(this.operation.eProfile.id)
      .subscribe({
        next: (response: Profile) => {
          this.dialog
            .open(ProfileReadonlyComponent, {
              data: response,
              disableClose: true,
              maxWidth: '800px',
              width: '90vw',
            })
            .afterClosed()
        },
      });
  }

  confirmar(): void {

    if (this.isLoading()) return;

    this.isLoading.set(true);

    this.service
      .confirmRec(this.operation.id)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (rs: any) => {
          if (rs) {
            this.toastr.success(
              '¡Correo enviado correctamente!',
              'Éxito'
            );
            this.dialogRef.close(true);
          } else {
            this.toastr.warning(
              rs || 'No se pudo confirmar la transferencia',
              'Advertencia'
            );
          }
        }
      });
  }

  public booleanNumber(event: string): boolean {
    if (Number(event) == 0) return false;
    return true;
  }
}
