import { Component, Input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/** La ilustracion va en WebP (23 kB frente a los 213 del PNG) y `artOk` la esconde si el archivo faltara. */
@Component({
  selector: 'app-auth-aside',
  standalone: true,
  // Solo `mat-flat-button`: con `MaterialModule` los 35 modulos caian en el chunk del login.
  imports: [RouterModule, MatButtonModule],
  template: `
  <aside class="auth-aside">
    <h2 class="auth-aside__title">{{ title }}</h2>
    <p class="auth-aside__text">{{ text }}</p>

    <a mat-flat-button class="gm-btn gm-btn--accent" [routerLink]="[link]">
      {{ cta }}
    </a>

    @if (artOk()) {
      <img
        class="auth-aside__art"
        src="assets/images/chanchito.webp"
        width="493"
        height="500"
        alt=""
        aria-hidden="true"
        (error)="artOk.set(false)" />
    }
  </aside>
  `
})
export class AuthAsideComponent {

  @Input({ required: true }) title!: string;
  @Input({ required: true }) text!: string;
  @Input({ required: true }) cta!: string;
  @Input({ required: true }) link!: string;

  /** Se apaga sola si el PNG aun no esta en assets, para no dejar la imagen rota. */
  readonly artOk = signal(true);
}
