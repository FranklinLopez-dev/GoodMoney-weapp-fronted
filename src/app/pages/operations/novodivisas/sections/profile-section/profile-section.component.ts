import { totalDelEncabezado } from 'src/app/shared/utils/paginacion-backend';
import {
    Component,
    DestroyRef,
    ElementRef,
    inject,
    Input,
    OnInit,
    signal,
    ViewChild
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { MaterialModule } from 'src/app/material.module';
import { DocumentType, Profile } from 'src/app/core/models';
import { ProfilesService } from 'src/app/pages/profiles/profiles.service';
import { NovodivisasStore } from '../../novodivisas.store';
import { DateMaskDirective } from 'src/app/shared/directives/date-mask.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { mapDocumentToValidatable } from 'src/app/utils/document.util';
import { InputMaskDirective } from 'src/app/shared/directives/input-mask.directive';
import { debounceTime, filter, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';
import { BanksAccountsService } from 'src/app/pages/bank-accounts/bank-accounts.service';
import { MatDialog } from '@angular/material/dialog';
import { SearchProfileComponent } from './profiles/profiles.component';
import { ProfilesStore } from './profiles/profiles.store';
import { PAGINATION_CONFIG } from 'src/app/shared/config/pagination.config';

@Component({
    selector: 'app-profile-section',
    standalone: true,
    imports: [
        TablerIconsModule,
        ReactiveFormsModule,
        MaterialModule,
        DateMaskDirective,
        InputMaskDirective
    ],
    templateUrl: './profile-section.component.html'
})
export class ProfileSectionComponent implements OnInit {

    @ViewChild('documentNumberInput') documentNumberInput!: ElementRef<HTMLInputElement>;
    @Input({ required: true }) form!: FormGroup;

    origenFondosList = [
        { id: '001:AHORROS', name: 'AHORROS' },
        { id: '002:ALQUILER DE BIENES MUEBLES', name: 'ALQUILER DE BIENES MUEBLES' },
        { id: '003:ALQUILER DE BIENES INMUEBLES', name: 'ALQUILER DE BIENES INMUEBLES' },
        { id: '004:DONACION / SORTEO', name: 'DONACION / SORTEO' },
        { id: '005:INGRESOS POR TRABAJO INDEPENDIENTE', name: 'INGRESOS POR TRABAJO INDEPENDIENTE' },
        { id: '006:INGRESOS POR TRABAJO DEPENDIENTE', name: 'INGRESOS POR TRABAJO DEPENDIENTE' },
        { id: '007:INGRESOS POR REGALIA', name: 'INGRESOS POR REGALIA' },
        { id: '008:PRÉSTAMOS', name: 'PRÉSTAMOS' },
        { id: '009:VENTA DE BIEN MUEBLE', name: 'VENTA DE BIEN MUEBLE' },
        { id: '010:VENTA DE BIEN INMUEBLE', name: 'VENTA DE BIEN INMUEBLE' },
        { id: '099:OTROS', name: 'OTROS' }
    ];

    private profilesService = inject(ProfilesService);
    private accounsService = inject(BanksAccountsService);
    private destroyRef = inject(DestroyRef);
    public validatorsService = inject(DynamicValidatorsService);
    private store = inject(NovodivisasStore);
    private profileStore = inject(ProfilesStore);
    readonly dialog = inject(MatDialog);

    readonly table = this.store.table;
    readonly formulario = this.store.form;
    readonly profileSelected$ = this.store.profile;

    readonly documentTypes = signal<DocumentType[] | []>([]);
    readonly document = signal<string | null>(null);
    readonly documentType = signal<DocumentType | null>(null);

    maxDate: Date = new Date();
    minDate: Date = (() => {
        const d = new Date();
        d.setDate(d.getDate() - 2);
        return d;
    })();

    results: Profile[] = [];
    loading = false;

    get control() {
        return this.form.controls;
    }

    get controlQuote() {
        return this.formulario()?.get('simulation') as FormGroup;
    }

    get controAccounts() {
        return this.formulario()?.get('accounts') as FormGroup;
    }

    constructor(private toaster: ToastrService) {

    }

    ngOnInit(): void {

        this.document.set(this.controlQuote.get('documentType')?.value);

        if (this.document() === '03') {
            this.documentTypes.set(this.table()?.documentTypes ?? []);
        } else {
            this.documentTypes.set(
                this.table()?.documentTypes.filter(d => !d.isNatural) ?? []
            );
        }

        const defaultType = this.table()?.documentTypes.find(d => d.id === this.form.get('documentTypeId')?.value) || null;
        this.documentType.set(defaultType);

        this.controlQuote.get('documentType')!.valueChanges.subscribe((value) => {
            const isBoleta = value === '03';
            this.document.set(value);
            this.initializeDocumentType(isBoleta);
            this.resetProfileFields();
        });

        this.controlQuote.get('amountUsd')!.valueChanges.subscribe((value) => {
            const origenFondosControl = this.form.get('origenFondos');

            if (value >= 5000) {
                origenFondosControl?.addValidators(Validators.required);
            } else {
                origenFondosControl?.clearValidators();
                origenFondosControl?.setValue(null);
            }

            origenFondosControl?.updateValueAndValidity();
        });

        const docNumberCtrl = this.form.get('documentNumber') as FormControl;

        docNumberCtrl.valueChanges
            .pipe(
                debounceTime(400),
                tap(() => {
                    if (docNumberCtrl.invalid) {
                        this.resetProfileFields(false);
                    }
                }),
                filter(() => docNumberCtrl.valid),
                switchMap(value =>
                    this.profilesService.getByDocument(
                        this.documentType()?.id!,
                        value
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(response => {
                if (response) {
                    this.store.setProfile(response);
                    this.form.patchValue({
                        names: response.names,
                        lastNames: response.lastNames,
                        address: response.address,
                    }, { emitEvent: false });

                    this.accounsService.getAllId(response.id)
                        .subscribe(accounts => {
                            this.store.setBankAccounts(accounts);
                        });

                } else {
                    this.toaster.warning('Usuario no encontrado', 'Advertencia');
                    this.resetProfileFields(false);
                }
            });
    }

    public focusDocumentInput(): void {
        setTimeout(() => {
            this.documentNumberInput?.nativeElement.focus();
            this.documentNumberInput?.nativeElement.select();
        });
    }

    private initializeDocumentType(isBoleta = true): void {

        if (isBoleta) {
            this.documentTypes.set(
                this.table()?.documentTypes ?? []
            );
        } else {
            this.documentTypes.set(
                this.table()?.documentTypes.filter(d => !d.isNatural
                ) ?? []
            );
        }

        const docTypeCtrl = this.form.get('documentTypeId') as FormControl;
        const docNumberCtrl = this.form.get('documentNumber') as FormControl;

        const defaultType = this.documentTypes().find(d => isBoleta ? d.code === '1' : d.code === '6') || null;
        this.documentType.set(defaultType);
        docTypeCtrl.setValue(defaultType?.id ?? null);

        this.validatorsService.applyValidators(
            docNumberCtrl,
            mapDocumentToValidatable(defaultType)
        );
    }


    private resetProfileFields(reset: boolean = true): void {
        const payload: any = {
            names: null,
            lastNames: null,
            address: null,
        };
        if (reset) {
            payload.documentNumber = null;
        }
        this.form.patchValue(payload, { emitEvent: false });
        this.clearProfile();
    }

    setDocumentType(id: number): void {
        const type = this.documentTypes().find(x => x.id === id) || null;
        if (!type) return;

        this.documentType.set(type);

        const ctrl = this.form.get('documentNumber') as FormControl;
        this.validatorsService.applyValidatorsWithReset(
            ctrl,
            mapDocumentToValidatable(type)
        );
    }

    selectProfile(profile: Profile): void {
        this.store.setProfile(profile);
        this.results = [];
    }

    clearProfile(): void {
        this.store.clearProfile();
        this.controAccounts.patchValue({
            originAccount: null,
            destinationAccounts: [],
            receiveByParts: false
        }, { emitEvent: false });
        this.store.clearBankAccounts();
    }

    changeProfile(valor: 'create-natural' | 'create-juridico'): void {
        if (this.profileSelected$()) {
            this.store.setMode('edit');
        } else {
            this.store.setMode(valor);
        }
    }

    openDialog() {

        const isLargeScreen = window.innerWidth > 992 ? '70vw' : '95vw';
        this.profilesService.getSearch(PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE, ' ', '', 'Name', this.document() == '03' ? '1' : '0').subscribe({
            next: response => {
                const data = response.body ?? [];

                const totalRecords = totalDelEncabezado(response.headers);

                this.profileStore.set(data);
                this.profileStore.setPagination(totalRecords, PAGINATION_CONFIG.DEFAULT_PAGE_INDEX, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

                const dialogRef = this.dialog.open(SearchProfileComponent, {
                    disableClose: true,
                    minWidth: isLargeScreen,
                    data: this.document() == '03' ? '1' : '0'
                })

                dialogRef.afterClosed().subscribe(result => {
                    if (!result) return;

                    const type = this.documentTypes().find(x => x.id === this.profileSelected$()?.documentTypeId) || null;
                    if (!type) return;

                    this.documentType.set(type);

                    const ctrl = this.form.get('documentNumber') as FormControl;
                    this.validatorsService.applyValidators(
                        ctrl,
                        mapDocumentToValidatable(type)
                    );

                    this.form.patchValue({
                        documentTypeId: this.profileSelected$()?.documentTypeId,
                        documentNumber: this.profileSelected$()?.documentNumber,
                        names: this.profileSelected$()?.names,
                        lastNames: this.profileSelected$()?.lastNames,
                        address: this.profileSelected$()?.address,
                    }, { emitEvent: false });

                    this.accounsService.getAllId(this.profileSelected$()?.id!)
                        .subscribe(accounts => {
                            this.store.setBankAccounts(accounts);
                        });
                });
            }
        });


    }
}
