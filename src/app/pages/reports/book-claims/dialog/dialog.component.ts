import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'client-dialog',
    imports: [
        MaterialModule,
        MatCardModule,
        TablerIconsModule,
        MatInputModule,
        MatButtonModule,
        CommonModule,
        MatDividerModule,
        MatTooltipModule,
        ClipboardModule
    ],
    templateUrl: './dialog.component.html'
})
export class BookClaimDialogComponent {

    public readonly baseUrl = environment.apiUrl;

    constructor(
        public dialogRef: MatDialogRef<BookClaimDialogComponent>,
        public dialog: MatDialog
    ) { }

    goBack(): void {
        this.dialogRef.close();
    }

    openCode(value: string) {
        if(!value) return;
        this.dialogRef.close(value);
    }

}
