import {
  Component,
  EventEmitter,
  Output,
  inject,
  computed,
  signal
} from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { OperationCreateStore } from '../../store/operation-create.store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { OperationsService } from '../../../operations.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-transfer-step',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, FallbackImgDirective],
  templateUrl: './transfer-step.component.html',
  styleUrls: ['./transfer-step.component.scss']
})
export class TransferStepComponent {

  @Output() next = new EventEmitter<void>();

  readonly store = inject(OperationCreateStore);
  readonly service = inject(OperationsService);
  private toastr = inject(ToastrService);
  readonly dialog = inject(MatDialog);
  readonly refreshTime = this.store.refreshTime;

  readonly quote = computed(() => this.store.quote());
  readonly accounts = computed(() => this.store.accounts());
  readonly transfer = computed(() => this.store.transfer());
  readonly table = this.store.table;

  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  isLoading = signal(false);

  copiedKey: string | null = null;

  copy(value: any, key?: string): void {
    if (!value) return;

    this.clipboard.copy(String(value));
    this.copiedKey = key ?? null;

    this.snack.open('Copiado al portapapeles', 'OK', {
      duration: 1500,
      panelClass: ['snack-success']
    });

    setTimeout(() => (this.copiedKey = null), 1200);
  }

  cancel() {
    if (this.isLoading()) return;
    this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Cancelar operación',
        message:
          `¿Estás seguro de que deseas cancelar esta operación? ¡Esta acción no se puede deshacer!`,
        confirmText: 'Cancelar operación',
        cancelText: 'Cerrar',
        color: 'warn'
      }
    })
      .afterClosed()
      .subscribe(confirm => {
        if (!confirm || this.isLoading()) return;

        const payload = {
          id: Number(this.transfer()?.operationId)
        }

        this.isLoading.set(true);

        this.service.cancel(payload as any)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              if (response == 'OK') {
                this.toastr.success(
                  "Operación cancelada correctamente",
                  "Éxito"
                );
                window.location.reload();
              } else {
                this.toastr.warning(response, "Advertencia");
              }
            }
          });

      });
  }

  continue(): void {
    this.next.emit();
  }
}