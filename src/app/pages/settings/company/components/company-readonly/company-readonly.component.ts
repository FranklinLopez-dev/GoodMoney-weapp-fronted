import { Component, computed, inject } from "@angular/core";
import { CompanyStore } from "../../company.store";
import { MaterialModule } from "src/app/material.module";
import { FallbackImgDirective } from "src/app/shared/directives/fallback-img.directive";
import { CountryService } from "src/app/shared/services/country.service";
import { UbigeosService } from "src/app/core/services/common/ubigeos.service";
import { AuthService } from "src/app/core/auth/auth.service";
import { Permission } from "src/app/core/auth/permissions.enum";
import { TablerIconsModule } from "angular-tabler-icons";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { of, switchMap } from "rxjs";
import { RucResponse, Ubigeo } from "src/app/core/models";
import { AuthStore } from "src/app/core/auth/auth.store";

@Component({
  standalone: true,
  imports: [MaterialModule, FallbackImgDirective, TablerIconsModule],
  selector: 'company-readonly',
  templateUrl: './company-readonly.component.html',
  styleUrl: './company-readonly.component.scss'
})
export class CompanyReadonlyComponent {
  public store = inject(CompanyStore);
  public authStore = inject(AuthStore);
  private countryService = inject(CountryService);
  private ubigeosService = inject(UbigeosService);
  private authService = inject(AuthService);
  readonly Permission = Permission;

  company = this.store.company;
  private company$ = toObservable(this.store.company);
  countries = this.countryService.countries;

  departments = computed(() =>
    this.store.tables()?.departaments ?? []
  );

  selectedCountry = computed(() => {
    const company = this.company();
    const countries = this.countries();

    if (!company?.country || !countries?.length) return null;
    return countries.find(c => c.cca2 === company.country.toUpperCase()) ?? null;
  });

  selectedDepartament = computed(() => {
    const company = this.company();
    const departments = this.departments();

    if (!company?.departament || !departments?.length) return null;
    return departments.find(d => d.code === company.departament) ?? null;
  });

  provinces = toSignal<Ubigeo[]>(
    this.company$.pipe(
      switchMap(company =>
        company?.departament
          ? this.ubigeosService.getProvinces(company.departament)
          : of([])
      )
    )
  );

  selectedProvince = computed(() => {
    const company = this.company();
    const provinces = this.provinces();

    if (!company?.province || !provinces?.length) return null;
    return provinces.find(p => p.code === company.province) ?? null;
  });

  districts = toSignal<Ubigeo[]>(
    this.company$.pipe(
      switchMap(company =>
        company?.province
          ? this.ubigeosService.getDistricts(company.province)
          : of<Ubigeo[]>([])
      )
    )
  );

  selectedDistrict = computed(() => {
    const company = this.company();
    const districts = this.districts();

    if (!company?.district || !districts?.length) return null;
    return districts.find(d => d.code === company.district) ?? null;
  });

  rucResponse = toSignal<RucResponse | null>(
    this.company$.pipe(
      switchMap(company =>
        company?.ruc
          ? this.authService.getRuc(company.ruc)
          : of(null)
      )
    )
  );

}
