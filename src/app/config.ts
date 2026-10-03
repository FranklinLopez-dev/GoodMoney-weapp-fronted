export interface AppSettings {
  dir: 'ltr' | 'rtl';
  theme: string;
  sidenavOpened: boolean;
  sidenavCollapsed: boolean;
  boxed: boolean;
  horizontal: boolean;
  activeTheme: string;
  language: string;
  cardBorder: boolean;
  navPos: 'side' | 'top';
}

export const defaults: AppSettings = {
  dir: 'ltr',
  theme: 'light',
  sidenavOpened: false,
  sidenavCollapsed: false,
  // Con `boxed` el contenido se topa a 1200 px y parte las franjas que van de borde a borde.
  boxed: false,
  horizontal: false,
  cardBorder: false,
  activeTheme: 'blue_theme',
  language: 'en-us',
  navPos: 'side',
};
