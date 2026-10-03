import { AfterViewInit, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'warn' | 'accent';
}

@Component({
  standalone: true,
  imports: [MaterialModule],
  template: `
    <h2 mat-dialog-title class="confirm-title">
      {{ data.title }}
    </h2>

    <mat-dialog-content>
      <p class="confirm-message">
        {{ data.message }}
      </p>
    </mat-dialog-content>

    <mat-dialog-actions class="confirm-actions">
      <button mat-flat-button class="btn-cerrar" (click)="close(false)">
        {{ data.cancelText ?? 'Cancelar' }}
      </button>

      <button
        mat-flat-button
        [color]="data.color ?? 'primary'"
        class="btn-confirmar"
        (click)="close(true)" cdkFocusInitial>
        {{ data.confirmText ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-title {
      font-size: 16px;
      font-weight: 700;
    }

    .confirm-message {
      margin: 0;
      font-size: 13px;
      font-weight: 400;
      line-height: 1.55;
      color: var(--gm-color-texto-principal, #000);
    }

    .confirm-actions {
      padding: 8px 20px 20px;
      gap: 12px;
    }

    .confirm-actions button {
      flex: 1 1 auto;
      min-width: 0;
      height: 40px;
      border-radius: 999px;
      font-weight: 700;
      white-space: nowrap;
    }

    /* Píldora gris de la lámina; tokens de ambas generaciones de Material por si conviven. */
    .btn-cerrar {
      --mat-button-filled-container-color: var(--gm-gris-500);
      --mat-button-filled-label-text-color: #fff;
      --mdc-filled-button-container-color: var(--gm-gris-500);
      --mdc-filled-button-label-text-color: #fff;
      background-color: var(--gm-gris-500);
      color: #fff;
    }
  `]
})
export class ConfirmDialogComponent implements AfterViewInit {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.dialogRef.addPanelClass('confirm-dialog-panel');
    // Compacto como la lámina, con sitio para que "Cancelar operación" no rompa en dos líneas.
    this.dialogRef.updateSize('430px');
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.centerOnOperationFlow());
  }

  private centerOnOperationFlow(): void {
    const flowCard = document.querySelector<HTMLElement>('.flujo:not(.flujo--cotiza) .flujo__tarjeta');
    if (!flowCard) return;

    const panes = Array.from(
      document.querySelectorAll<HTMLElement>('.cdk-overlay-pane.confirm-dialog-panel')
    );
    const pane = panes[panes.length - 1];
    if (!pane) return;

    const rect = flowCard.getBoundingClientRect();
    const flowCenter = rect.left + rect.width / 2;
    const viewportCenter = window.innerWidth / 2;

    pane.classList.add('confirm-dialog-panel--flow-centered');
    pane.style.setProperty(
      '--gm-confirm-dialog-offset-x',
      `${Math.round(flowCenter - viewportCenter)}px`
    );
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
