/** Angular reemplaza environment.ts por este al compilar con `production`, que es la que usa el deploy. */
export const environment = {
  production: true,
  apiUrl: 'https://goodmoney.pseperu.pro',
  // Página pública donde el cliente valida su comprobante (sitio web).
  urlConsulta: 'https://goodmoney.pe/consulta',
  recaptcha: {
    siteKey: '6Leicb8mAAAAAO-xbD2-DJFaVJ0jEgElX18PbnDV',
  }
};
