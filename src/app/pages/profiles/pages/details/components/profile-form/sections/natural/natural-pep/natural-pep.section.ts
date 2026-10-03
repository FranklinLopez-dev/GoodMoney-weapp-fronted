import {
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaterialModule } from 'src/app/material.module';
import { ProfilesTablesStore } from 'src/app/pages/profiles/tables/profiles-tables.store';
import { minArrayLength } from 'src/app/shared/validators/min-array-length.validator';
import { DynamicValidatorsService, IDynamicValidatable } from 'src/app/shared/services/dynamic-validators.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { Positions } from 'src/app/core/models';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-natural-pep-section',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, SelectSearchAsyncComponent],
  templateUrl: './natural-pep.section.html',
  styles: [`
    .pep-texto {
      display: block;
      width: 100%;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.45;
      text-align: justify;
      color: var(--gm-plomo-700);
    }

    .pep-tabla {
      font-family: inherit;
      table-layout: fixed;
    }

    .pep-tabla th,
    .pep-tabla td {
      font-family: inherit;
      font-size: 13px;
      line-height: 1.35;
      vertical-align: middle;
    }

    .pep-tabla th {
      font-weight: 600;
      color: var(--gm-color-texto-principal);
      text-align: left;
    }

    .pep-tabla__numero {
      width: 48px;
      text-align: left;
    }

    .pep-tabla__texto {
      text-align: left;
    }
  `]
})
export class NaturalPepSectionComponent implements OnInit {

  @Input({ required: true }) form!: FormGroup;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  validatorsService = inject(DynamicValidatorsService);
  store = inject(ProfilesTablesStore);

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

  get control() {
    return this.form.controls;
  }

  get parientesPep(): FormArray {
    return this.control['parientesPep'] as FormArray;
  }

  get parientesFamiliarPep(): FormArray {
    return this.control['parientesFamiliarPep'] as FormArray;
  }

  get isPepCtrl(): FormControl {
    return this.control['isPep'] as FormControl;
  }

  get isFamiliarPepCtrl(): FormControl {
    return this.control['isFamiliarPep'] as FormControl;
  }

  get cargoCtrl(): FormControl {
    return this.control['cargo'] as FormControl;
  }

  get institutionCtrl(): FormControl {
    return this.control['institution'] as FormControl;
  }

  get position(): FormControl | null {
    return this.form.contains('positionId')
      ? this.form.get('positionId') as FormControl
      : null;
  }

  get origenFondos(): FormControl | null {
    return this.form.contains('origenFondos')
      ? this.form.get('origenFondos') as FormControl
      : null;
  }

  positions = computed(() =>
    this.store.tables()?.positions ?? []
  );
  filteredPositions: Positions[] = [];

  ngOnInit(): void {
    this.filteredPositions = this.positions();
    this.applyValidators();

    this.isPepCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isPep => {
        this.applyValidators();
        if (isPep && this.parientesPep.length === 0) {
          this.parientesPep.push(this.createPariente());
        }
      });

    this.isFamiliarPepCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isFamiliar => {
        this.applyValidators();
        if (isFamiliar && this.parientesFamiliarPep.length === 0) {
          this.parientesFamiliarPep.push(this.createPariente());
        }
      });
  }

  private applyValidators(): void {

    const validatable: IDynamicValidatable = {
      isRequired: true
    };

    if (this.isPepCtrl.value) {
      this.parientesPep.setValidators(minArrayLength(1));
      this.validatorsService.applyValidators(this.institutionCtrl, validatable);
      this.validatorsService.applyValidators(this.cargoCtrl, validatable);
    } else {
      this.parientesPep.clearValidators();
      this.parientesPep.clear();
      this.institutionCtrl.clearValidators();
      this.institutionCtrl.reset();
      this.cargoCtrl.clearValidators();
      this.cargoCtrl.reset();
    }

    if (this.isFamiliarPepCtrl.value) {
      this.parientesFamiliarPep.setValidators(minArrayLength(1));
    } else {
      this.parientesFamiliarPep.clearValidators();
      this.parientesFamiliarPep.clear();
    }

    this.parientesPep.updateValueAndValidity({ emitEvent: false });
    this.parientesFamiliarPep.updateValueAndValidity({ emitEvent: false });
  }

  createPariente(): FormGroup {
    return this.fb.group({
      names: [null, Validators.required],
      relationship: [null, Validators.required]
    });
  }

  canAdd(array: FormArray): boolean {
    if (!array.length) return true;
    return array.at(array.length - 1).valid;
  }

  addPep(): void {
    if (!this.canAdd(this.parientesPep)) return;
    this.parientesPep.push(this.createPariente());
  }

  removePep(index: number): void {
    if (this.parientesPep.length > 1) {
      this.parientesPep.removeAt(index);
    }
  }

  addFamiliar(): void {
    if (!this.canAdd(this.parientesFamiliarPep)) return;
    this.parientesFamiliarPep.push(this.createPariente());
  }

  removeFamiliar(index: number): void {
    if (this.parientesFamiliarPep.length > 1) {
      this.parientesFamiliarPep.removeAt(index);
    }
  }

  loadPositions = (search: string) => {
    this.filteredPositions = this.positions().filter(p =>
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  };

}
