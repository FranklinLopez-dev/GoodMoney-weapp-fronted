import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localeEsPe from '@angular/common/locales/es-PE';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEsPe, 'es-PE');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
