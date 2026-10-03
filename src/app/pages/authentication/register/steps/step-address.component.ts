import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CountryService } from 'src/app/shared/services/country.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Country, Ubigeo } from 'src/app/core/models';
import { UbigeosService } from 'src/app/core/services/common/ubigeos.service';
import { SelectSearchAsyncComponent } from 'src/app/shared/components/select-search-async/select-search-async.component';
import { TrimDirective } from 'src/app/shared/directives/trim-input.directive';
import { DynamicValidatorsService } from 'src/app/shared/services/dynamic-validators.service';
import { RegisterStore } from '../register.store';

@Component({
  selector: 'register-step-address',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    SelectSearchAsyncComponent,
    TrimDirective
  ],
  template: `
    <div class="auth-section">
      <h2 class="auth-section__title">Dirección</h2>
      <p class="auth-section__hint">@if(store.status() === 'natural') { Cuéntenos dónde vives, ingrese su dirección completa incluyendo calle, número y ciudad. } @else { Ahora indicanos la dirección fiscal, ingrese su dirección completa incluyendo calle, número y ciudad. }</p>
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
          <mat-select formControlName="departament" (selectionChange)="onDepartmentChange($event.value)">
            @for (d of departments(); track d.code) {
            <mat-option [value]="d.code">{{ d.departament }}</mat-option>
            }
          </mat-select>
          @if(control['departament'].touched && control['departament'].invalid) {
          <mat-hint class="su-error">
            Departamento es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-6">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Provincia</mat-label>
          <mat-select formControlName="province" (selectionChange)="onProvinceChange($event.value)">
            @for (p of provinces(); track p.code) {
              @if(p.code) {
              <mat-option [value]="p.code">{{ p.province }}</mat-option>
              }
            }
          </mat-select>
          @if(control['province'].touched && control['province'].invalid) {
          <mat-hint class="su-error">
            Provincia es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-6">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Distrito</mat-label>
          <mat-select formControlName="district">
            @for (d of districts(); track d.code) {
              @if(d.code) {
              <mat-option [value]="d.code">{{ d.district }}</mat-option>
              }
            }
          </mat-select>
          @if(control['district'].touched && control['district'].invalid) {
          <mat-hint class="su-error">
            Distrito es obligatorio
          </mat-hint>
          }
        </mat-form-field>
      </div>
      <div class="col-md-12">
        <mat-form-field class="w-100" appearance="outline">
          <mat-label>Dirección</mat-label>
          <textarea maxlength="300" matInput cdkTextareaAutosize formControlName="address" appTrim></textarea>
          @if(control['address'].touched && control['address'].invalid) {
          <mat-hint class="su-error">
            {{ validatorsService.getErrorMessage(control['address'], 'Dirección') }}
          </mat-hint>
          }
        </mat-form-field>
      </div>
    </div>
  `
})
export class StepAddressComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  store = inject(RegisterStore);
  validatorsService = inject(DynamicValidatorsService);
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
    return this.group.get('country') as FormControl;
  }

  ngOnInit() {
    this.filteredCountries = this.countries();

    this.restoreUbigeos();
  }

  private restoreUbigeos() {
    const departmentCode = this.control['departament'].value;
    const provinceCode = this.control['province'].value;

    this.control['province'].disable();
    this.control['district'].disable();

    if (departmentCode) {
      this.ubigeosService.getProvinces(departmentCode).subscribe(res => {
        this.provinces.set(res);
        this.control['province'].enable();

        if (provinceCode) {
          this.ubigeosService.getDistricts(provinceCode).subscribe(dist => {
            this.districts.set(dist);
            this.control['district'].enable();
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
    this.control['province'].reset();
    this.control['district'].reset();
    this.control['district'].disable();

    if (!departmentCode) {
      this.control['province'].disable();
      return;
    }

    this.control['province'].disable();

    this.ubigeosService.getProvinces(departmentCode).subscribe({
      next: res => {
        this.provinces.set(res);
        this.control['province'].enable();
      },
    });
  }

  onProvinceChange(provinceCode: string) {
    this.districts.set([]);
    this.control['district'].reset();

    if (!provinceCode) {
      this.control['district'].disable();
      return;
    }

    this.control['district'].disable();

    this.ubigeosService.getDistricts(provinceCode).subscribe({
      next: res => {
        this.districts.set(res);
        this.control['district'].enable();
      },
    });
  }
}