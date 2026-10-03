import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { debounceTime, filter, switchMap, tap } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RucResponse } from 'src/app/core/models';
import { MaterialModule } from 'src/app/material.module';
import { CompanyStore } from 'src/app/pages/settings/company/company.store';
import { FallbackImgDirective } from 'src/app/shared/directives/fallback-img.directive';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, MaterialModule, FallbackImgDirective, InputMaskDirective],
    selector: 'company-general-tab',
    templateUrl: './company-general.component.html'
})
export class CompanyGeneralComponent {
    private store = inject(CompanyStore);
    authService = inject(AuthService);
    private fb = inject(FormBuilder);
    validatorsService = inject(DynamicValidatorsService);
    private destroyRef = inject(DestroyRef);

    company = computed(() => this.store.company()!);
    rucResponse = signal<RucResponse | null>(null);
    messageError = signal<string | null>(null);

    frontFile = signal<string | null>(null);

    form = this.fb.nonNullable.group({
        ruc: ['', Validators.required],
        name: ['', Validators.required],
        tradeName: ['', Validators.required],
        status: [true, Validators.requiredTrue],
    });

    get control() {
        return this.form.controls;
    }

    constructor() {

        const rucCtrl = this.control['ruc'] as FormControl;
        if (!rucCtrl) return;

        this.validatorsService.applyValidators(
            rucCtrl,
            { isExact: true, isNumeric: true, sizeMax: 11, sizeMin: 11, isRequired: true }
        );

        this.initializeForm();
    }

    private initializeForm() {
        const c = this.store.company();
        if (c) {
            this.form.patchValue(c);

            if (c.logo) {
                this.frontFile.set(`data:image/jpeg;base64,${c.logo}`);
            }

            this.authService.getRuc(c.ruc)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(res => {
                    this.rucResponse.set(res);
                });
        }

    }

    ngOnInit() {
        const rucCtrl = this.control['ruc'] as FormControl;
        if (!rucCtrl) return;

        rucCtrl.valueChanges
            .pipe(
                debounceTime(400),
                tap(() => {
                    this.rucResponse.set(null);
                    this.control['status'].setValue(true);
                    this.messageError.set(null);
                }),
                filter(() => rucCtrl.valid),
                switchMap(value => this.authService.getRuc(value)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(response => {
                this.rucResponse.set(response);
                if (response?.success) {
                    this.control['name'].setValue(response.data.nombre_o_razon_social ?? null);
                    this.store.update(
                        {
                            name: response.data.nombre_o_razon_social ?? null,
                            address: response.data.direccion ?? null
                        }
                    )
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
                        this.store.update(
                            {
                                departament: response?.data.ubigeo[0] + "0000",
                                province: response?.data.ubigeo[1] + "00",
                                district: response?.data.ubigeo_sunat
                            }
                        )
                    }
                } else {
                    this.control['status'].setValue(false);
                    this.messageError.set("Ruc no encontrado");
                }
            });

    }

    setFileFront(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const dataUrl: string = e.target.result;
            this.frontFile.set(dataUrl);
            const base64 = dataUrl.split(',')[1];
            this.store.update({ logo: base64 });
        };
        reader.readAsDataURL(file);
    }

    removeFileFront() {
        this.frontFile.set(null);
        this.store.update({ logo: null });
    }

    markAllAsTouched() {
        this.form.markAllAsTouched();
    }

    save() {
        this.store.update(this.form.getRawValue());
    }

}
