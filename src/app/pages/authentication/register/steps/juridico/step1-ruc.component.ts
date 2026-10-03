import { Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RegisterStore } from './../../register.store';
import { AuthService } from 'src/app/core/auth/auth.service';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';
import { debounceTime, filter, switchMap, tap } from 'rxjs';
import { DocumentType, RucResponse } from 'src/app/core/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileViewerDialogComponent } from 'src/app/shared/components/file-viewer/file-viewer-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { resolveFileUrl } from 'src/app/utils/pdf.util';

@Component({
  selector: 'register-juridico-step1-ruc',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    InputMaskDirective,
    TrimDirective
  ],
  template: `
  <div class="auth-section">
    <h2 class="auth-section__title">Datos de tu empresa</h2>
    <p class="auth-section__hint">¡Perfecto! Empecemos con el Nro de RUC. <br> Toma en cuenta que debes registrarte con RUC 20, si posees RUC 10 tienes la opción de registrarte como Persona solo con tu DNI.</p>
  </div>

  <div class="row" [formGroup]="group">
    <div class="col-12">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Número de {{documentType()?.name ? documentType()?.name:'documento'}}</mat-label>
        <input matInput formControlName="documentNumber" [maxLengthValue]="documentType()?.sizeMax!"
          [appInputMask]="documentType()?.isNumeric ? 'numeric' : 'text'" />
        @if(control['documentNumber'].touched && control['documentNumber'].invalid) {
        <mat-hint class="su-error">
          {{ validatorsService.getErrorMessage(
          control['documentNumber'],
          'Número de ' + (documentType()?.name ?? 'documento')) }}
        </mat-hint>
        }
        @if(control['documentNumber'].valid && messageError()) {
        <mat-hint class="su-error"> {{messageError()}}</mat-hint>
        }
      </mat-form-field>
    </div>
    <div class="col-12">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Razón Social</mat-label>
        <input matInput formControlName="names" maxlength="200" appTrim />
        @if(control['names'].touched && control['names'].invalid) {
        <mat-hint class="su-error">
          {{ validatorsService.getErrorMessage(control['names'], 'Razón Social') }}
        </mat-hint>
        }
      </mat-form-field>
    </div>
    @if(documentType()?.name) {
    <div class="col-12 document-upload">
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Subir Ficha RUC</mat-label>
        <input matInput formControlName="documentPhotoFrontName" placeholder="Subir archivo" readonly />
        @if(!control['documentPhotoFrontName'].value) {
        <ng-container matSuffix>
        <button mat-mini-fab class="bg-primary text-white rounded-right" type="button"
          (click)="fileInput.click()" matTooltip="Subir archivo PDF">
          <i-tabler name="upload" class="icon-20 d-flex"></i-tabler>
        </button>
        </ng-container>
        }
          
        @if(control['documentPhotoFrontName'].value) {
        <ng-container matSuffix>
          <button mat-mini-fab class="bg-error text-white rounded-none" type="button"
            (click)="onRemoveFront()" matTooltip="Eliminar archivo">
            <i-tabler name="trash" class="icon-20 d-flex"></i-tabler>
          </button>
          <button mat-mini-fab class="bg-primary text-white rounded-right" type="button"
            (click)="abrirPDF()" matTooltip="Ver archivo PDF">
            <i-tabler name="eye" class="icon-20 d-flex"></i-tabler>
          </button>
        </ng-container>
        }
      </mat-form-field>
      <input #fileInput type="file" [multiple]="false" hidden accept=".pdf" (change)="uploadDocument($event)" />
    </div>
    }
    @if(rucResponse()?.data?.estado != 'ACTIVO' && rucResponse()?.success) {
    <div class="m-t-16 col-12">
      <div class="p-24 rounded bg-light-error -t-16">
        <div class="f-s-14 text-error">
          <span class="f-w-600">¡Importante!</span> Los comprobantes de pago o
          notas de débito emitidos por este contribuyente no dan derecho a
          crédito fiscal del IGV, en tanto se encuentra con estado de <span
            class="f-w-600">{{rucResponse()?.data?.estado}}</span>.
        </div>
      </div>
    </div>
    }
  </div>
  `
})
export class JuridicoStep1RucComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;
  @ViewChild('fileInput') fileInput: any;

  store = inject(RegisterStore);
  authService = inject(AuthService);
  validatorsService = inject(DynamicValidatorsService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  documentTypes = computed(() =>
    this.authService.authTable()?.documentTypes.filter(d => !d.isNatural) ?? []
  );

  documentType = signal<DocumentType | null>(null);
  rucResponse = signal<RucResponse | null>(null);
  messageError = signal<string | null>(null);

  get control() {
    return this.group.controls;
  }

  ngOnInit() {
    const documentTypeCtrl = this.control['documentTypeId'] as FormControl;

    if (!documentTypeCtrl.value) {
      const defaultType = this.documentTypes().find(d => d.code === '6') || null;
      this.documentType.set(defaultType);
      documentTypeCtrl.setValue(defaultType?.id ?? null);
    } else {
      const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
      this.documentType.set(selected);
    }

    const documentNumberCtrl = this.group.get('documentNumber') as FormControl;
    if (!documentNumberCtrl) return;

    this.validatorsService.applyValidators(
      documentNumberCtrl,
      mapDocumentToValidatable(this.documentType())
    );

    documentNumberCtrl.valueChanges
      .pipe(
        debounceTime(400),
        tap(() => {
          this.rucResponse.set(null);
          this.control['status'].setValue(true);
          this.messageError.set(null);
        }),
        filter(() => this.documentType()?.code === '6'),
        filter(() => documentNumberCtrl.valid),
        switchMap(value => this.authService.getRuc(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.rucResponse.set(response);
        if (response?.success) {
          this.control['names'].setValue(response.data.nombre_o_razon_social ?? null);
          this.group.parent?.get('step4.address')?.setValue(response.data.direccion ?? null);
          if (response?.data?.estado != "ACTIVO") {
            this.control['status'].setValue(false);
            this.messageError.set(`El RUC se encuentra en estado ${response?.data?.estado}`)
          } else if (response?.data?.condicion != "HABIDO") {
            this.control['status'].setValue(false);
            this.messageError.set(`El RUC se encuentra en condición ${response?.data?.condicion}`);
          } else {
            this.messageError.set(null);
          }
          if (response?.data.ubigeo?.[0]) {
            this.group.parent?.get('step4.departament')?.setValue(response?.data.ubigeo[0] + "0000");
            this.group.parent?.get('step4.province')?.setValue(response?.data.ubigeo[1] + "00");
            this.group.parent?.get('step4.district')?.setValue(response?.data.ubigeo_sunat);
          }
        } else {
          this.control['status'].setValue(false);
          this.messageError.set("Ruc no encontrado");
        }
      });
  }

  uploadDocument(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.control['documentPhotoFrontByte']?.setValue(e.target.result?.replace(/^data:application\/[a-z]+;base64,/, ""));
      this.control['documentPhotoFrontName']?.setValue(file.name);
    };
    reader.readAsDataURL(file);
  }

  onRemoveFront() {
    this.control['documentPhotoFrontByte']?.reset();
    this.control['documentPhotoFrontName']?.reset();
  }

  resetForm() {
    this.group.parent?.reset();
    this.store.reset()
  }

  abrirPDF(): void {

    let base64 = this.control['documentPhotoFrontByte']?.value;

    const resolved = resolveFileUrl(base64);
    if (!resolved) return;

    this.dialog.open(FileViewerDialogComponent, {
      data: {
        name: 'Ficha RUC',
        type: resolved.type,
        url: resolved.url
      },
      panelClass: 'file-viewer-dialog',
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

}
