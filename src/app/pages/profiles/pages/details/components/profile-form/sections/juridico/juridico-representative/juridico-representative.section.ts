import { Component, computed, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter, switchMap } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { DocumentType, Positions } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';

@Component({
  selector: 'app-juridico-representative-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    InputMaskDirective,
    SelectSearchAsyncComponent,
    DateMaskDirective
  ],
  templateUrl: './juridico-representative.section.html'
})
export class JuridicoRepresentativeSectionComponent implements OnInit {

  @Input({ required: true }) form!: FormGroup;

  store = inject(ProfilesTablesStore);
  authService = inject(AuthService);
  validatorsService = inject(DynamicValidatorsService);
  private destroyRef = inject(DestroyRef);

  documentTypes = computed(() =>
    this.store.tables()?.documentTypes.filter(d => d.isNatural) ?? []
  );

  maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  })();

  documentType = signal<DocumentType | null>(null);

  get control() {
    return this.form.controls;
  }

  get position() {
    return this.form.get('positionId') as FormControl;
  }

  positions = computed(() =>
    this.store.tables()?.positions ?? []
  );
  filteredPositions: Positions[] = [];

  ngOnInit() {

    this.filteredPositions = this.positions();
    const documentTypeCtrl = this.control['documentTypeRepId'] as FormControl;

    if (!documentTypeCtrl.value) {
      const defaultType = this.documentTypes().find(d => d.code === '1') || null;
      this.documentType.set(defaultType);
      documentTypeCtrl.setValue(defaultType?.id ?? null);
    } else {
      const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
      this.documentType.set(selected);
    }

    if (this.control['dateOfBirth'].value) {
      this.control['dateOfBirth'].setValue(new Date(this.control['dateOfBirth'].value));
    }

    const documentNumberRepCtrl = this.form.get('documentNumberRep') as FormControl;
    if (!documentNumberRepCtrl) return;

    this.validatorsService.applyValidators(
      documentNumberRepCtrl,
      mapDocumentToValidatable(this.documentType())
    );

    documentNumberRepCtrl.valueChanges
      .pipe(
        debounceTime(400),
        filter(() => this.documentType()?.code === '1'),
        filter(() => documentNumberRepCtrl.valid),
        switchMap(value => this.authService.getDni(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        if (response?.success) {
          this.control['namesRep'].setValue(response.data.nombres);
          this.control['lastNamePaternoRep'].setValue(response.data.apellido_paterno);
          this.control['lastNameMaternoRep'].setValue(response.data.apellido_materno);
        }
      });
  }

  setDocumentType(id: number) {
    const type = this.documentTypes().find(x => x.id === id) || null;
    this.documentType.set(type);
    const ctrl = this.form.get('documentNumberRep') as FormControl;
    this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
  }

  loadPositions = (search: string) => {
    this.filteredPositions = this.positions().filter(p =>
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  };

}
