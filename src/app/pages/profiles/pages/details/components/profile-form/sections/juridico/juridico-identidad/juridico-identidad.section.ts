import { Component, computed, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, filter, switchMap, tap } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Activities, DocumentType, RucResponse } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { ActivitiesDialogComponent } from 'src/app/pages/settings/activities/activities-dialog.component';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { environment } from 'src/environments/environment';
import { AsyncPipe } from '@angular/common';
import { ArchivoPrivadoPipe } from 'src/app/shared/pipes/archivo-privado.pipe';
type ProfileContext = 'client' | 'admin';

@Component({
  selector: 'app-juridico-identidad-section',
  standalone: true,
  imports: [ArchivoPrivadoPipe, AsyncPipe, 
    ReactiveFormsModule,
    MaterialModule,
    InputMaskDirective,
    SelectSearchAsyncComponent,
    FallbackImgDirective
  ],
  templateUrl: './juridico-identidad.section.html'
})
export class JuridicoIdentidadSectionComponent implements OnInit {

  @Input({ required: true }) form!: FormGroup;
  @Input() context?: ProfileContext;

  store = inject(ProfilesTablesStore);
  authService = inject(AuthService);
  validatorsService = inject(DynamicValidatorsService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private baseUrl = environment.apiUrl;

  documentTypes = computed(() =>
    this.store.tables()?.documentTypes.filter(d => !d.isNatural) ?? []
  );

  documentType = signal<DocumentType | null>(null);
  frontFile = signal<string | null>(null);
  rucResponse = signal<RucResponse | null>(null);
  messageError = signal<string | null>(null);

  get control() {
    return this.form.controls;
  }

  get activity() {
    return this.form.get('activityId') as FormControl;
  }

  activities = computed(() =>
    this.store.tables()?.activities ?? []
  );
  filteredActivities: Activities[] = [];

  ngOnInit() {

    this.filteredActivities = this.activities();
    const documentTypeCtrl = this.control['documentTypeId'] as FormControl;

    if (!documentTypeCtrl.value) {
      const defaultType = this.documentTypes().find(d => d.code === '6') || null;
      this.documentType.set(defaultType);
      documentTypeCtrl.setValue(defaultType?.id ?? null);
    } else {
      const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
      this.documentType.set(selected);
    }

    if (this.control['profilePhoto'].value) {
      this.frontFile.set(this.control['profilePhoto'].value);
    }

    if (this.control['documentNumber'].value && this.documentType()?.code == '6') {
      this.authService.getRuc(this.control['documentNumber'].value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(res => {
          this.rucResponse.set(res);
        });
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
          this.control['address'].setValue(response.data.direccion ?? null);
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
            this.control['departament'].setValue(response?.data.ubigeo[0] + "0000");
            this.control['province'].setValue(response?.data.ubigeo[1] + "00");
            this.control['district'].setValue(response?.data.ubigeo_sunat);
          }
        } else {
          this.control['status'].setValue(false);
          this.messageError.set("Ruc no encontrado");
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

  loadActivities = (search: string) => {
    this.filteredActivities = this.activities().filter(a =>
      a.description.toLowerCase().includes(search.toLowerCase())
    );
  };

  create(): void {
    const dialogRef = this.dialog.open(ActivitiesDialogComponent, {
      disableClose: true,
      width: '500px',
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;
        this.store.upsertActivity(result);
        this.filteredActivities = this.store.tables()?.activities!;
      },
    });
  }

}