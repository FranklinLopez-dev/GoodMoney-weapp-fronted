import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { AppSettings } from 'src/app/config';
import { CoreService } from 'src/app/services/core.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';

// Modulos de Material sueltos: `MaterialModule` reexporta 35 y los arrastra al bundle inicial.
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-customizer',
    imports: [
        TablerIconsModule,
        MatButtonToggleModule,
        MatTooltipModule,
        FormsModule,
        NgScrollbarModule,
    ],
    templateUrl: './customizer.component.html',
    encapsulation: ViewEncapsulation.None
})
export class CustomizerComponent {

  options = this.settings.getOptions();

@Output() optionsChange = new EventEmitter<AppSettings>();
  hideSingleSelectionIndicator = signal(true);

  constructor(private settings: CoreService) { }
  setDark() {
    this.settings.setOptions({ theme: 'dark' });
    this.emitOptions();
  }

  setColor(color: string) {
    this.settings.setOptions({ activeTheme: color });
    this.emitOptions();
  }

  setDir(dir: 'ltr' | 'rtl') {
    this.settings.setOptions({ dir: dir });
    this.emitOptions();
  }

  setSidebar(sidenavOpened: boolean) {
    this.settings.setOptions({ sidenavOpened: sidenavOpened });
    this.emitOptions();
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }
}

