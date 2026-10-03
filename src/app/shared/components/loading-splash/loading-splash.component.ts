import { Component, Input } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-loading-splash',
  standalone: true,
  templateUrl: './loading-splash.component.html',
  styleUrls: ['./loading-splash.component.scss'],
  imports: [TablerIconsModule]
})
export class LoadingSplashComponent {
  @Input() title: string = 'Cargando';
  @Input() subtitle: string = 'Por favor espera...';
  @Input() showTips: boolean = true;
}
