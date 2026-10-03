import { Component, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingSplashHostComponent } from 'src/app/shared/components/loading-splash/loading-splash-host.component';
import { AsistenteComponent } from 'src/app/shared/components/asistente/asistente.component';

// Modulos de Material sueltos: `MaterialModule` reexporta 35 y los arrastra al primer bundle.
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  imports: [RouterOutlet, MatSidenavModule, CommonModule, LoadingSplashHostComponent, AsistenteComponent],
})
export class BlankComponent {
  private htmlElement!: HTMLHtmlElement;

  options = this.settings.getOptions();

  constructor(private settings: CoreService) {
    this.htmlElement = document.querySelector('html')!;
    this.receiveOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.toggleDarkTheme(options);
    this.toggleColorsTheme(options);
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }

  toggleColorsTheme(options: AppSettings) {
    this.htmlElement.classList.forEach((className) => {
      if (className.endsWith('_theme')) {
        this.htmlElement.classList.remove(className);
      }
    });

    this.htmlElement.classList.add(options.activeTheme);
  }
}
