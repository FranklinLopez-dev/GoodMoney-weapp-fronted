import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSplashComponent } from './loading-splash.component';
import { LoadingSplashService } from '../../services/loading-splash.service';

@Component({
  selector: 'app-loading-splash-host',
  standalone: true,
  imports: [CommonModule, LoadingSplashComponent],
  template: `
    @if (splash.isVisible()) {
      <app-loading-splash
        [title]="splash.config().title!"
        [subtitle]="splash.config().subtitle!"
        [showTips]="splash.config().showTips!" />
    }
  `
})
export class LoadingSplashHostComponent {
  splash = inject(LoadingSplashService);
}
