import { esEstadoActivo, aEstadoApi } from 'src/app/shared/utils/estado';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { DocumentType } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DocumentTypeService } from '../document-type.service';
import { DocumentTypeStore } from '../document-type.store';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-document-type-dialog',
  imports: [MaterialModule, ReactiveFormsModule, TablerIconsModule],
  templateUrl: './document-type-dialog.component.html'
})
export class DocumentTypeDialogComponent {

  @Input() data: DocumentType | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private service = inject(DocumentTypeService);
  private store = inject(DocumentTypeStore);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    id: [null],
    name: ['', [Validators.required, Validators.maxLength(200), this.repetido('name')]],
    code: ['', [Validators.required, Validators.maxLength(10), this.repetido('code')]],
    sizeMin: [null, Validators.required],
    sizeMax: [null, Validators.required],
    isNumeric: [false],
    isExact: [false],
    isNatural: [true],
    isDefault: [false],
    status: [true]
  });

  get control() {
    return this.form.controls;
  }

  private repetido(campo: string): ValidatorFn {
    return noRepetido(() => this.store.items(), campo, () => this.data?.id);
  }

  constructor(private toastr: ToastrService) { }

  ngOnInit() {
    if (this.data) {
      this.form.patchValue(this.data as any);
      this.control['status'].setValue(esEstadoActivo(this.data.status));
    }
  }

  save() {
    if (this.loading()) return;
    
    const payload: any = this.form.getRawValue();
    payload.status = aEstadoApi(payload.status);

    this.loading.set(true);
    const req = payload.id
      ? this.service.update(payload as any)
      : this.service.create(payload as any);

    req.pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        if (payload.id) {
          this.toastr.success('Documento editado correctamente', 'Éxito');
        } else {
          this.toastr.success('Documento creado correctamente', 'Éxito');
        }
        this.saved.emit()
      }
    });
  }
}
