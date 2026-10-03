import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/** Columna derecha en modo guía: chip amarillo, el monito explicando el paso, botón opcional y el chanchito. */
@Component({
  selector: 'app-auth-guia-aside',
  standalone: true,
  imports: [RouterModule, MatButtonModule],
  template: `
  <aside class="auth-aside auth-aside--pasos">
    <div class="auth-step-chip auth-step-chip--aside">{{ chip }}</div>

    <div class="auth-aside__guia">
      <img class="auth-aside__monito" src="assets/images/logos/icono.png" alt="" aria-hidden="true" />
      <p class="auth-aside__burbuja">{{ hint }}</p>
    </div>

    @if (cta && link) {
    <a mat-flat-button class="gm-btn gm-btn--accent auth-aside__cta" [routerLink]="[link]">
      {{ cta }}
    </a>
    }

    <img class="auth-aside__art" src="assets/images/chanchito.webp" width="493" height="500" alt=""
      aria-hidden="true" />
  </aside>
  `
})
export class AuthGuiaAsideComponent {
  @Input({ required: true }) chip!: string;
  @Input({ required: true }) hint!: string;
  @Input() cta?: string;
  @Input() link?: string;
}
