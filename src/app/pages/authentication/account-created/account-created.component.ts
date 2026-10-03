import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { AuthGuiaAsideComponent } from '../aside/auth-guia-aside.component';

/** Sustituye a verify-email: el correo ya se verificó con el código del paso 1 y la cuenta nace confirmada. */
@Component({
  selector: 'app-account-created',
  standalone: true,
  imports: [MaterialModule, AuthGuiaAsideComponent],
  template: `
  <div class="auth-screen">

    <div class="auth-screen__main">

      <img class="auth-brand" src="assets/images/logos/logo-good-money.webp" width="600" height="238" alt="Good Money" />

      <div class="cuenta-creada">
        <img class="cuenta-creada__badge" src="assets/images/badge-check.webp" alt="" aria-hidden="true" />

        <h1 class="cuenta-creada__titulo">¡Bienvenido a Good Money!</h1>
        <p class="cuenta-creada__texto">¡Tu cuenta ha sido creada con éxito!</p>
        <p class="cuenta-creada__texto">
          Tu registro ha finalizado exitosamente y tu cuenta está lista para que empieces a operar.
        </p>
      </div>
    </div>

    <app-auth-guia-aside
      chip="¿Listo para empezar?"
      hint="Dale clic en Inicia Sesión y comienza a disfrutar del mejor TC"
      cta="Inicia sesión"
      link="/authentication/login" />

  </div>
  `
})
export class AccountCreatedComponent { }
