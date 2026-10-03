import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthService } from 'src/app/core/auth/auth.service';
import { PasswordValidators } from 'src/app/shared/validators/password.validators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { AssignProfilesStore } from '../assign-profiles.store';
import { debounceTime, filter, finalize, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { Country, DocumentType, Ubigeo } from 'src/app/core/models';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AssignProfileComponent } from '../assign-profiles.component';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { CountryService } from 'src/app/shared/services/country.service';

@Component({
    selector: 'register-juridico-admi',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MaterialModule,
        TablerIconsModule,
        InputMaskDirective,
        SelectSearchAsyncComponent
    ],
    templateUrl: './create-juridico.component.html'
})
export class CreateJuridicoComponent {

    loading = signal(false);
    readonly hidePassword = signal(true);
    readonly hidePasswordConfirm = signal(true);
    private dialog = inject(MatDialog);
    private profilesStore = inject(AssignProfilesStore);
    validatorsService = inject(DynamicValidatorsService);
    private storeProfile = inject(ProfilesTablesStore);
    private store = inject(AssignProfilesStore);
    profile = this.profilesStore.profile;
    private destroyRef = inject(DestroyRef);
    private ubigeos = inject(UbigeosService);
    private countryService = inject(CountryService);

    countries = this.countryService.countries;
    departments = computed(() =>
        this.storeProfile.tables()?.departaments ?? []
    );

    documentTypes = computed(() =>
        this.storeProfile.tables()?.documentTypes.filter(d => d.isNatural) ?? []
    );
    documentType = signal<DocumentType | null>(null);

    provinces = signal<Ubigeo[]>([]);
    districts = signal<Ubigeo[]>([]);
    filteredCountries: Country[] = [];
    frontFile = signal<string | null>(null);
    backFile = signal<string | null>(null);

    form = this.fb.group({
        email: [this.profile()?.email, [Validators.required, Validators.email]],
        password: [null, [Validators.required, Validators.minLength(6)]],
        passwordConfirm: [null, Validators.required],
        isMe: [true, Validators.required],
        documentTypeBenefId: [null],
        documentNumberBenef: [null],
        namesBenef: [null],
        lastNamePaternoBenef: [null],
        lastNameMaternoBenef: [null],
        documentPhotoFrontByteBenef: [null, Validators.required],
        documentPhotoReverseByteBenef: [null, Validators.required],
        addressBenef: [null, Validators.required],
        countryBenef: ['PE', Validators.required],
        departamentBenef: [null, Validators.required],
        provinceBenef: [null, Validators.required],
        districtBenef: [null, Validators.required]
    },
        {
            validators: PasswordValidators.mustMatch("password", "passwordConfirm"),
        }
    );

    private readonly beneficiaryControls = [
        'documentTypeBenefId',
        'documentNumberBenef',
        'namesBenef',
        'lastNamePaternoBenef',
        'lastNameMaternoBenef'
    ];

    get control() {
        return this.form.controls;
    }

    get countryControl(): FormControl {
        return this.control['countryBenef'] as FormControl;
    }

    constructor(
        public assignProfile: AssignProfileComponent,
        private toastr: ToastrService,
        private fb: FormBuilder,
        private service: AuthService
    ) {
        this.filteredCountries = this.countries();
    }

    ngOnInit() {

        const documentTypeCtrl = this.control['documentTypeBenefId'] as FormControl;

        if (!documentTypeCtrl.value) {
            const defaultType = this.documentTypes().find(d => d.code === '1') || null;
            this.documentType.set(defaultType);
            documentTypeCtrl.setValue(defaultType?.id ?? null);
        } else {
            const selected = this.documentTypes().find(d => d.id === documentTypeCtrl.value) || null;
            this.documentType.set(selected);
        }

        const documentNumberCtrl = this.form.get('documentNumberBenef') as FormControl;
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
                switchMap(value => this.service.getDni(value)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(response => {
                if (response?.success) {
                    this.control['namesBenef'].setValue(response.data.nombres as any);
                    this.control['lastNamePaternoBenef'].setValue(response.data.apellido_paterno as any);
                    this.control['lastNameMaternoBenef'].setValue(response.data.apellido_materno as any);
                }
            });

        this.control['departamentBenef'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(code => {
                this.provinces.set([]);
                this.districts.set([]);
                if (this.control['departamentBenef'].dirty) {
                    this.control['provinceBenef'].reset();
                    this.control['districtBenef'].reset();
                }
                this.control['provinceBenef'].disable();
                this.control['districtBenef'].disable();
                this.loadInitialProvinces(code!);
            });

        this.control['provinceBenef'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(code => {
                this.districts.set([]);
                if (this.control['provinceBenef'].dirty) {
                    this.control['districtBenef'].reset();
                }
                this.control['districtBenef'].disable();
                this.loadInitialDistricts(code!);
            });

        this.updateBeneficiaryValidators(this.control['isMe'].value!);

        this.control['isMe'].valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(isMe => {
                this.updateBeneficiaryValidators(isMe!);
            });
    }

    save(): void {
        if (this.form.invalid || this.loading()) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Crear cuenta',
                message: `¿Estás seguro que deseas crear cuenta para sociar este perfil ${this.profile()?.names}?`,
            },
        });

        dialogRef.afterClosed().subscribe({
            next: (confirmed) => {
                if (!confirmed) return;

                this.loading.set(true);

                const payload = {
                    ... this.form.value,
                    profileId: this.profile()?.id,
                    lastNamesRep: this.profile()?.lastNamePaternoRep + ' ' + this.profile()?.lastNameMaternoRep,
                    documentTypeBenefId: this.form.value.isMe ? this.profile()?.documentTypeRepId : this.form.value.documentTypeBenefId,
                    documentNumberBenef: this.form.value.isMe ? this.profile()?.documentNumberRep : this.form.value.documentNumberBenef,
                    namesBenef: this.form.value.isMe ? this.profile()?.namesRep : this.form.value.namesBenef,
                    lastNamePaternoBenef: this.form.value.isMe ? this.profile()?.lastNamePaternoRep : this.form.value.lastNamePaternoBenef,
                    lastNameMaternoBenef: this.form.value.isMe ? this.profile()?.lastNameMaternoRep : this.form.value.lastNameMaternoBenef,
                    lastNamesBenef: this.form.value.isMe ? (this.profile()?.lastNamePaternoRep + ' ' + this.profile()?.lastNameMaternoRep) : (this.form.value.lastNamePaternoBenef + ' ' + this.form.value.lastNameMaternoBenef)
                }

                this.service.registerJuridicoAdmi(payload as any)
                    .pipe(
                        finalize(() => {
                            this.loading.set(false);
                        })
                    )
                    .subscribe({
                        next: (response: any) => {
                            if (response?.success) {
                                this.toastr.success('Cuenta creada correctamente', "Éxito");
                                this.store.setEdit(false);
                                this.assignProfile.loadData();
                            } else {
                                this.toastr.warning(response?.error, "Advertencia!");
                            }

                        }
                    });
            },
        });

    }

    loadCountries = (search: string) => {
        this.filteredCountries = this.countries().filter(c =>
            c.name.common.toLowerCase().includes(search.toLowerCase())
        );
    };

    private loadInitialProvinces(code: string) {
        this.ubigeos.getProvinces(code).subscribe(res => {
            this.provinces.set(res);
            this.control['provinceBenef'].enable();
        });
    }

    private loadInitialDistricts(code: string) {
        this.ubigeos.getDistricts(code).subscribe(res => {
            this.districts.set(res);
            this.control['districtBenef'].enable();
        });
    }

    setFileFront(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.frontFile.set(e.target.result);
            this.control['documentPhotoFrontByteBenef'].setValue(this.frontFile()?.replace(/^data:image\/[a-z]+;base64,/, "") as any);
        };
        reader.readAsDataURL(file);
    }

    removeFileFront() {
        this.frontFile.set(null);
        this.control['documentPhotoFrontByteBenef'].reset();
    }

    setFileReverse(event: any): void {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.backFile.set(e.target.result);
            this.control['documentPhotoReverseByteBenef'].setValue(this.backFile()?.replace(/^data:image\/[a-z]+;base64,/, "") as any);
        };
        reader.readAsDataURL(file);
    }

    removeFileReverse() {
        this.backFile.set(null);
        this.control['documentPhotoReverseByteBenef'].reset();
    }

    private updateBeneficiaryValidators(isMe: boolean): void {
        this.beneficiaryControls.forEach(name => {
            const control = this.form.get(name);
            if (!control) return;

            if (!isMe) {
                control.setValidators(Validators.required);
            } else {
                control.clearValidators();
                control.reset(); // opcional: limpia valores si ya no aplica
            }

            control.updateValueAndValidity({ emitEvent: false });
        });
    }


    cancel(): void {
        this.store.setEdit(false);
    }

    setDocumentType(id: number) {
        const type = this.documentTypes().find(x => x.id === id) || null;
        this.documentType.set(type);
        const ctrl = this.form.get('documentNumberBenef') as FormControl;
        this.validatorsService.applyValidatorsWithReset(ctrl, mapDocumentToValidatable(type));
    }

}
