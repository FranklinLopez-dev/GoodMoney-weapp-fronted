import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CountryService } from 'src/app/shared/services/country.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Country, Ubigeo } from 'src/app/core/models';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { RegisterStore } from '../../register.store';

@Component({
  selector: 'register-juridico-step9-address',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    SelectSearchAsyncComponent
  ],
  template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Dirección del beneficiario</h2>
      <p class="auth-section__hint">Cuéntenos dónde vives, ingrese su dirección completa incluyendo calle, número y ciudad.</p>
    </div>

    <div class="row" [formGroup]="group">
      <div class="col-md-6">
        <app-select-search-async class="w-100"
          label="País"
          [items]="filteredCountries"
          valueKey="cca2"
          labelKey="name.common"
          imageKey="flags.svg"
          imageAltKey="name.common"
          [control]="countryControl"
          (search)="loadCountries($event)">
        </app-select-search-async>
      </div>
      <div class="col-md-6">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Departamento</mat-label>
          <mat-select formControlName="departamentBenef" (selectionChange)="onDepartmentChange($event.value)">
            @for (d of departments(); track d.code) {
            <mat-option [value]="d.code">{{ d.departament }}</mat-option>
            }
          </mat-select>
          @if(control['departamentBenef'].touched && control['departamentBenef'].invalid) {
          <mat-hint class="su-error">
            Departamento es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-6">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Provincia</mat-label>
          <mat-select formControlName="provinceBenef" (selectionChange)="onProvinceChange($event.value)">
            @for (p of provinces(); track p.code) {
              @if(p.code) {
              <mat-option [value]="p.code">{{ p.province }}</mat-option>
              }
            }
          </mat-select>
          @if(control['provinceBenef'].touched && control['provinceBenef'].invalid) {
          <mat-hint class="su-error">
            Provincia es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-6">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Distrito</mat-label>
          <mat-select formControlName="districtBenef">
            @for (d of districts(); track d.code) {
              @if(d.code) {
              <mat-option [value]="d.code">{{ d.district }}</mat-option>
              }
            }
          </mat-select>
          @if(control['districtBenef'].touched && control['districtBenef'].invalid) {
          <mat-hint class="su-error">
            Distrito es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-12">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Dirección</mat-label>
          <textarea maxlength="300" matInput cdkTextareaAutosize formControlName="addressBenef"></textarea>
          @if(control['addressBenef'].touched && control['addressBenef'].invalid) {
          <mat-hint class="su-error">
            Dirección es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
    </div>
  `
})
export class JuridicoStep9AddressComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  store = inject(RegisterStore);
  countryService = inject(CountryService);
  authService = inject(AuthService);
  ubigeosService = inject(UbigeosService);

  countries = this.countryService.countries;
  filteredCountries: Country[] = [];
  departments = computed(() =>
    this.authService.authTable()?.departaments ?? []
  );

  provinces = signal<Ubigeo[]>([]);
  districts = signal<Ubigeo[]>([]);

  get control() {
    return this.group.controls;
  }

  get countryControl(): FormControl {
    return this.group.get('countryBenef') as FormControl;
  }

  ngOnInit() {
    this.filteredCountries = this.countries();

    this.restoreUbigeos();
  }

  private restoreUbigeos() {
    const departmentCode = this.control['departamentBenef'].value;
    const provinceCode = this.control['provinceBenef'].value;

    this.control['provinceBenef'].disable();
    this.control['districtBenef'].disable();

    if (departmentCode) {
      this.ubigeosService.getProvinces(departmentCode).subscribe(res => {
        this.provinces.set(res);
        this.control['provinceBenef'].enable();

        if (provinceCode) {
          this.ubigeosService.getDistricts(provinceCode).subscribe(dist => {
            this.districts.set(dist);
            this.control['districtBenef'].enable();
          });
        }
      });
    }
  }

  loadCountries = (search: string) => {
    this.filteredCountries =  this.countries().filter(c =>
      c.name.common.toLowerCase().includes(search.toLowerCase())
    );
  };

  onDepartmentChange(departmentCode: string) {
    this.provinces.set([]);
    this.districts.set([]);
    this.control['provinceBenef'].reset();
    this.control['districtBenef'].reset();
    this.control['districtBenef'].disable();

    if (!departmentCode) {
      this.control['provinceBenef'].disable();
      return;
    }

    this.control['provinceBenef'].disable();

    this.ubigeosService.getProvinces(departmentCode).subscribe({
      next: res => {
        this.provinces.set(res);
        this.control['provinceBenef'].enable();
      },
    });
  }

  onProvinceChange(provinceCode: string) {
    this.districts.set([]);
    this.control['districtBenef'].reset();

    if (!provinceCode) {
      this.control['districtBenef'].disable();
      return;
    }

    this.control['districtBenef'].disable();

    this.ubigeosService.getDistricts(provinceCode).subscribe({
      next: res => {
        this.districts.set(res);
        this.control['districtBenef'].enable();
      },
    });
  }
}