import {
  Component,
  inject,
  Input,
  signal
} from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesStore } from 'src/app/pages/profiles/profiles.store';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { resolveFileUrl } from 'src/app/utils/pdf.util';
import { environment } from 'src/environments/environment';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
  selector: 'app-documentation-section',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, ReactiveFormsModule, MaterialModule, TablerIconsModule, FallbackImgDirective],
  templateUrl: './documentation.section.html'
})
export class DocumentationSectionComponent {

  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) isNatural!: boolean;
  @Input({ required: true }) isAdmin!: boolean;

  private dialog = inject(MatDialog);
  private profilesStore = inject(ProfilesStore);
  frontFile = signal<string | null>(null);
  backFile = signal<string | null>(null);
  baseUrl = environment.apiUrl;
  profile = this.profilesStore.current;

  get control() {
    return this.form.controls;
  }

  ngOnInit() {
    if (this.isAdmin) {
      if (this.isNatural) {
        this.control['documentPhotoFrontName'].setValidators(Validators.required);
        this.control['documentPhotoReverseName'].setValidators(Validators.required);
      } else {
        this.control['documentPhotoFrontName'].setValidators(Validators.required);
      }
    } else {
      if(this.profile === null) {
        this.control['documentPhotoFrontName'].setValidators(Validators.required);
      }
    }

    this.control['documentPhotoFrontName'].updateValueAndValidity();
    this.control['documentPhotoReverseName'].updateValueAndValidity();

    if (this.control['documentPhotoFront'].value) {
      this.control['documentPhotoFrontName'].setValue(this.getFileName(this.control['documentPhotoFront'].value))
      this.frontFile.set(this.control['documentPhotoFront'].value)
    }

    if (this.control['documentPhotoReverse'].value) {
      this.control['documentPhotoReverseName'].setValue(this.getFileName(this.control['documentPhotoReverse'].value))
      this.backFile.set(this.control['documentPhotoReverse'].value)
    }
  }

  uploadFile(
    event: Event,
    type: 'front' | 'reverse'
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {

      const base64 = (reader.result as string).split(',')[1];

      if (type === 'front') {
        this.frontFile.set(reader.result as any);
        this.form.patchValue({
          documentPhotoFrontByte: base64,
          documentPhotoFrontName: file.name
        });
      } else {
        this.backFile.set(reader.result as any);
        this.form.patchValue({
          documentPhotoReverseByte: base64,
          documentPhotoReverseName: file.name
        });
      }
    };

    reader.readAsDataURL(file);
  }

  remove(type: 'front' | 'reverse') {
    if (type === 'front') {
      this.frontFile.set(null);
      this.form.patchValue({
        documentPhotoFrontByte: null,
        documentPhotoFrontName: null,
        documentPhotoFront: null
      });
    } else {
      this.backFile.set(null);
      this.form.patchValue({
        documentPhotoReverseByte: null,
        documentPhotoReverseName: null,
        documentPhotoReverse: null
      });
    }
  }

  openFront(isFront: boolean): void {

    let value = isFront
      ? this.control['documentPhotoFrontByte']?.value
      : this.control['documentPhotoReverseByte']?.value;

    if (!value) {
      value = isFront
        ? this.control['documentPhotoFront']?.value
        : this.control['documentPhotoReverse']?.value;
    }

    const resolved = resolveFileUrl(value);
    if (!resolved) return;

    this.dialog.open(FileViewerDialogComponent, {
      data: {
        name: isFront ? 'Ficha RUC' : 'Documentación adicional',
        type: resolved.type,
        url: resolved.url
      },
      panelClass: 'file-viewer-dialog',
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }


  private getFileName(path: string): string {
    return path.split('/').pop() ?? path;
  }

}
