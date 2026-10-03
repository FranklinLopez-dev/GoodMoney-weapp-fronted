import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';

@Component({
    selector: 'book-claims-details',
    templateUrl: './details.component.html',
    imports: [
        MaterialModule,
        CommonModule,
        TablerIconsModule,
        FormsModule,
        ReactiveFormsModule,
        FallbackImgDirective
    ],
    providers: [DatePipe]
})
export class BookClaimsDetailsComponent {
    action: string;
    local_data: any;
    photo: any = null;
    photoByte: any = null;

    private static readonly PESO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

    constructor(
        public dialogRef: MatDialogRef<BookClaimsDetailsComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
        private datePipe: DatePipe,
        private toastr: ToastrService
    ) {
        this.local_data = { ...data };
        this.action = this.local_data.action;
    }

    public onselectImage(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > BookClaimsDetailsComponent.PESO_MAXIMO_IMAGEN) {
            this.toastr.warning('La imagen no debe superar los 5 MB.', 'Advertencia');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e: any) => {
            this.photo = e.target.result;
            this.photoByte = this.photo.replace(/^data:image\/[a-z]+;base64,/, "");
        }
    }

    onRemoveImage() {
        this.photo = this.photoByte = null;
    }

    doAction(): void {
        if (this.photoByte) {
            this.local_data.bookClaimImageByte = this.photoByte;
        }
        this.dialogRef.close({ event: this.action, data: this.local_data });
    }

    closeDialog(): void {
        this.dialogRef.close({ event: 'Cancel' });
    }
}
