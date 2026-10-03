import { Component, computed, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter, switchMap } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { DocumentType } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { environment } from 'src/environments/environment';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';

@Component({
  selector: 'app-natural-identidad-section',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, 
    ReactiveFormsModule,
    MaterialModule,
    InputMaskDirective,
    FallbackImgDirective
  ],
  templateUrl: './natural-identidad.section.html'
})
export class NaturalIdentidadSectionComponent implements OnInit {

  @Input({ required: true }) form!: FormGroup;

  store = inject(ProfilesTablesStore);
  authService = inject(AuthService);
  validatorsService = inject(DynamicValidatorsService);
  private destroyRef = inject(DestroyRef);
  private baseUrl = environment.apiUrl;

  documentTypes = computed(() =>
    this.store.tables()?.documentTypes.filter(d => d.isNatural) ?? []
  );

  documentType = signal<DocumentType | null>(null);
  frontFile = signal<string | null>(null);

  get control() {
    return this.form.controls;
  }

  ngOnInit() {

    const documentTypeCtrl = this.control['documentTypeId'] as FormControl;

    if (!documentTypeCtrl.value) {
      const defaultType = this.documentTypes().find(d => d.code === '1') || null;
      this.documentType.set(defaultType);
      documentTypeCtrl.setValue(defaultType?.id ?? null);
    } else {
      const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
      this.documentType.set(selected);
    }

    if (this.control['profilePhoto'].value) {
      this.frontFile.set(this.control['profilePhoto'].value);
    }

    const documentNumberCtrl = this.form.get('documentNumber') as FormControl;
    if (!documentNumberCtrl) return;

    this.validatorsService.applyValidators(
      documentNumberCtrl,
      mapDocumentToValidatable(this.documentType())
    );

    documentNumberCtrl.valueChanges
      .pipe(
        debounceTime(400),
        filter(() => this.documentType()?.code === '1'),
        filter(() => documentNumberCtrl.valid),
        switchMap(value => this.authService.getDni(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        if (response?.success) {
          this.control['names'].setValue(response.data.nombres);
          this.control['lastNamePaterno'].setValue(response.data.apellido_paterno);
          this.control['lastNameMaterno'].setValue(response.data.apellido_materno);
        }
      });
  }

  setDocumentType(id: number) {
    const type = this.documentTypes().find(x => x.id === id) || null;
    this.documentType.set(type);
    const ctrl = this.form.get('documentNumber') as FormControl;
    this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
  }

  setFileFront(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl: string = e.target.result;
      this.frontFile.set(dataUrl);
      const base64 = dataUrl.split(',')[1];
      this.control['profilePhotoByte'].setValue(base64);
    };
    reader.readAsDataURL(file);
  }

  removeFileFront() {
    this.frontFile.set(null);
    this.control['profilePhotoByte'].setValue(null);
    this.control['profilePhoto'].setValue(null);
  }

}
