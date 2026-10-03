import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RegisterStore } from '../../register.store';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'register-natural-step4-files',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule
  ],
  template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Fotos de tu documento</h2>
      <p class="auth-section__hint">Seleccione tu documento de identidad de la parte frontal y posterior.</p>
    </div>

    <div class="row" [formGroup]="group">
      <div class="col-md-6">
        <input #fileFrontInput type="file" [multiple]="false" hidden accept="image/*" (change)="setFileFront($event)" />
        @if(!frontFile()) {
        <div class="border-dropzone" (click)="fileFrontInput.click()">
            <div class="dropzone-content preview flex-col">
                <img src="./assets/images/dni-frontal.png" alt="Upload" class="upload-icon m-b-4"
                    style="max-height: 200px !important;" />
                <span class="f-s-14 text-center">Seleccione una foto frontal
                    de tu documento</span>
            </div>
        </div>
        } @else {
        <div class="border-dropzone" (click)="removeFileFront()">
            <div class="dropzone-content preview">
                <img [src]="frontFile()" alt="Upload" class="upload-icon m-b-4" />
            </div>
        </div>
        }
      </div>
      <div class="col-md-6">
        <input #fileReverseInput type="file" [multiple]="false" hidden accept="image/*" (change)="setFileReverse($event)" />
        @if(!backFile()) {
        <div class="border-dropzone" (click)="fileReverseInput.click()">
            <div class="dropzone-content preview flex-col">
                <img src="./assets/images/dni-reverse.png" alt="Upload" class="upload-icon m-b-4"
                    style="max-height: 200px !important;" />
                <span class="f-s-14 text-center">Seleccione una foto posterior
                    de tu documento</span>
            </div>
        </div>
        } @else {
        <div class="border-dropzone" (click)="removeFileReverse()">
            <div class="dropzone-content preview">
                <img [src]="backFile()" alt="Upload" class="upload-icon m-b-4" />
            </div>
        </div>
        }
      </div>
    </div>  
  `
})
export class NaturalStep4FilesComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  store = inject(RegisterStore);
  authService = inject(AuthService);

  documentTypeId = computed(() =>
    this.group.parent?.get('step3.documentTypeId')?.value as number
  );

  documentNumber = computed(() =>
    this.group.parent?.get('step3.documentNumber')?.value ?? ''
  );

  documentType = computed(() =>
    this.authService.authTable()?.documentTypes?.find(
      doc => doc.id === this.documentTypeId()
    ) ?? null
  );

  frontFile = signal<string | null>(null);
  backFile = signal<string | null>(null);

  get control() {
    return this.group.controls;
  }

  ngOnInit() {
    this.restoreFilesPreview();
  }

  private restoreFilesPreview() {
    const front = this.control['documentPhotoFrontByte']?.value;
    const back = this.control['documentPhotoReverseByte']?.value;

    if (front) {
      this.frontFile.set(`data:image/jpeg;base64,${front}`);
    }

    if (back) {
      this.backFile.set(`data:image/jpeg;base64,${back}`);
    }
  }

  setFileFront(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.frontFile.set(e.target.result);
      this.control['documentPhotoFrontByte'].setValue(this.frontFile()?.replace(/^data:image\/[a-z]+;base64,/, ""));
    };
    reader.readAsDataURL(file);
  }

  removeFileFront() {
    this.frontFile.set(null);
    this.control['documentPhotoFrontByte'].reset();
  }

  setFileReverse(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.backFile.set(e.target.result);
      this.control['documentPhotoReverseByte'].setValue(this.backFile()?.replace(/^data:image\/[a-z]+;base64,/, ""));
    };
    reader.readAsDataURL(file);
  }

  removeFileReverse() {
    this.backFile.set(null);
    this.control['documentPhotoReverseByte'].reset();
  }

}
