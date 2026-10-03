import { esEstadoActivo, aEstadoApi } from 'src/app/shared/utils/estado';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Banks } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { BanksService } from '../banks.service';
import { BanksStore } from '../banks.store';
import { noRepetido } from 'src/app/shared/validators/no-repetido.validator';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { finalize } from 'rxjs/operators';

@Component({
    standalone: true,
    selector: 'app-banks-dialog',
    imports: [MaterialModule, ReactiveFormsModule, TablerIconsModule, FallbackImgDirective],
    templateUrl: './banks-dialog.component.html'
})
export class BanksDialogComponent {

    @Input() data: Banks | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private service = inject(BanksService);
    private store = inject(BanksStore);
    frontFile = signal<string | null>(null);
    loading = signal(false);

    form = this.fb.nonNullable.group({
        id: [null],
        name: [null, [Validators.required, Validators.maxLength(200), this.repetido('name')]],
        code: [null, [Validators.required, Validators.maxLength(10), this.repetido('code')]],
        minAcount: [null, Validators.required],
        maxAcount: [null, Validators.required],
        minAcountInter: [null, Validators.required],
        maxAcountInter: [null, Validators.required],
        comitionPen: [null, Validators.required],
        comitionUsd: [null, Validators.required],
        status: [true],
        icon: [''],
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
            if (this.data.icon) {
                this.frontFile.set(`data:image/jpeg;base64,${this.data.icon}`);
            }

        }
    }

    setFileFront(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const dataUrl: string = e.target.result;
            this.frontFile.set(dataUrl);
            const base64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
            this.control['icon'].setValue(base64);
        };
        reader.readAsDataURL(file);
    }

    removeFileFront() {
        this.frontFile.set(null);
        this.control['icon'].setValue(null!);
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
                    this.toastr.success('Banco editado correctamente', 'Éxito');
                } else {
                    this.toastr.success('Banco creado correctamente', 'Éxito');
                }
                this.saved.emit()
            }
        });
    }
}
