import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Ambos logos van en el DOM y los elige _sidebar.scss: el hover no toca `sidebarNav-mini` y por JS salía gigante. */
@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <div class="d-flex align-items-center">
      <a [routerLink]="['/']" class="logodark">
        <img
          src="./assets/images/logos/logo-white.png"
          class="align-middle m-2 w-100 logo-full"
          width="512"
          height="184"
          alt="logo"
        />
        <img
          src="./assets/images/logos/icono.png"
          class="align-middle m-2 w-100 logo-icon"
          width="150"
          height="154"
          alt="logo"
        />
      </a>

      <a [routerLink]="['/']" class="logolight w-100">
        <img
          src="./assets/images/logos/logo-white.png"
          class="align-middle m-2 w-100 logo-full"
          width="512"
          height="184"
          alt="logo"
        />
        <img
          src="./assets/images/logos/icono.png"
          class="align-middle m-2 w-100 logo-icon"
          width="150"
          height="154"
          alt="logo"
        />
      </a>
    </div>
  `,
})
export class BrandingComponent {}
