import { CommonModule } from '@angular/common';
import {
    Component,
    Inject,
} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
} from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';

@Component({
    selector: 'app-modal-location',
    templateUrl: './location.component.html',
    styles: [`
    .location-datos {
      width: 100%;
      margin-bottom: 12px;
    }

    .location-datos td {
      padding: 4px 0;
    }

    .location-datos td:first-child {
      width: 1%;
      padding-right: 24px;
      font-weight: 600;
      white-space: nowrap;
    }

    .location-mapa {
      display: block;
      width: 100%;
      border: 0;
      border-radius: 8px;
    }
  `],
    imports: [
        MaterialModule,
        TablerIconsModule,
        CommonModule
      ]
})
export class ModalLocationComponent {

    location: any;
    urlLocation: any;

    constructor(
        public matDialogRef: MatDialogRef<ModalLocationComponent>,
        @Inject(MAT_DIALOG_DATA)
        public _data: any,
        private sanitizer: DomSanitizer
    ) {

    }

    ngOnInit(): void {
        try {
            this.location = JSON.parse(this._data?.location);
        } catch {
            this.location = null;
        }
        const lat = Number(this.location?.lat);
        const lon = Number(this.location?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const mapUrl = `https://www.google.com/maps?q=${lat},${lon}&hl=es&z=14&output=embed`;
            this.urlLocation = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
        }
    }


}