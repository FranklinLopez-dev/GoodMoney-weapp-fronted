import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs';

export interface LoadingSplashConfig {
  title?: string;
  subtitle?: string;
  showTips?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingSplashService {
  private router = inject(Router);

  // Una navegacion mas corta que esto no llega a pintar splash: aparecer y desaparecer es un destello, no informacion.
  private readonly UMBRAL_MS = 200;

  private pendiente: ReturnType<typeof setTimeout> | null = null;

  isVisible = signal<boolean>(false);
  config = signal<LoadingSplashConfig>({
    title: 'Cargando',
    subtitle: 'Por favor espera...',
    showTips: true
  });

  constructor() {

    this.show({
      title: 'Cargando',
      subtitle: 'Inicializando aplicación...',
      showTips: false
    });

    this.initializeRouterEvents();
  }

  private initializeRouterEvents() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.cancelarPendiente();
        if (this.isVisible()) {
          return;
        }

        this.pendiente = setTimeout(() => this.show({
          title: 'Cargando página',
          subtitle: 'Estamos preparando el contenido...',
          showTips: false
        }), this.UMBRAL_MS);
      });

    // Tambien en cancelacion o error: si un resolver falla no hay NavigationEnd y el splash no se iba nunca.
    this.router.events
      .pipe(filter(event =>
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ))
      .subscribe(() => this.hide());
  }

  private cancelarPendiente() {
    if (this.pendiente !== null) {
      clearTimeout(this.pendiente);
      this.pendiente = null;
    }
  }

  show(config: LoadingSplashConfig = {}) {
    this.config.set({
      title: config.title ?? 'Cargando',
      subtitle: config.subtitle ?? 'Por favor espera...',
      showTips: config.showTips ?? true
    });
    this.isVisible.set(true);
  }

  hide() {
    this.cancelarPendiente();
    this.isVisible.set(false);
  }

  setConfig(config: LoadingSplashConfig) {
    this.config.update(current => ({
      ...current,
      ...config
    }));
  }
}
