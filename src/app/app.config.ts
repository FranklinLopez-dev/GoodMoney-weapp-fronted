import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
  provideEnvironmentInitializer,
  inject,
  LOCALE_ID
} from '@angular/core';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ToastrModule } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';
import { tablerIconsUsados } from './icon/tabler-icons';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxPermissionsModule } from 'ngx-permissions';

// Importar `MaterialModule` entero arrastraba sus 35 modulos (1,09 MB) al bundle inicial.
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideNgxMask } from 'ngx-mask';
import { CustomDateAdapter, MAT_DATE_CUSTOM_FORMATS } from './shared/utils/custom-date-adapter';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LoadingSplashService } from './shared/services/loading-splash.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { paginadorEnEspanol } from './core/i18n/paginator-es';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { datepickerEnEspanol } from './core/i18n/datepicker-es';

export function HttpLoaderFactory(http: HttpClient): any {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Sin esto Angular sigue formateando en en-US aunque `main.ts` registre el locale.
    { provide: LOCALE_ID, useValue: 'es-PE' },

    // El paginador de Material viene en inglés y aparece en las 23 tablas.
    { provide: MatPaginatorIntl, useFactory: paginadorEnEspanol },
    { provide: MatDatepickerIntl, useFactory: datepickerEnEspanol },

    // Con el sizing fijo los mensajes de validación van en posición absoluta y se montan sobre el campo siguiente.
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },

    // Lo que antes entraba por `importProvidersFrom(MaterialModule)`.
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_CUSTOM_FORMATS },
    provideNgxMask(),
    provideAnimationsAsync(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideEnvironmentInitializer(() => {
      inject(LoadingSplashService);
    }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(
      FormsModule,
      ToastrModule.forRoot(),
      ReactiveFormsModule,
      NgxPermissionsModule.forRoot(),
      TablerIconsModule.pick(tablerIconsUsados),
      NgScrollbarModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
  ],
};
