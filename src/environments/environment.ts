/**
 * Entorno de DESARROLLO. Es el que usa `ng serve` en la maquina del
 * desarrollador y apunta al backend LOCAL.
 *
 * En produccion Angular reemplaza este archivo por environment.prod.ts
 * (fileReplacements en angular.json), asi que aqui nunca debe quedar una URL de
 * produccion: si se cuela, `ng serve` opera contra datos reales.
 *
 * Para levantar el backend local:
 *   cd GoodMoney-Backend
 *   ASPNETCORE_URLS=http://localhost:5090 dotnet run --project BACKENDGOODMONEY
 *
 * Puerto 5090 y no el 5000 por defecto de .NET: en macOS el 5000 lo ocupa
 * Control Center (receptor de AirPlay) y el API no puede levantar ahi.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5090',
  // Página pública donde el cliente valida su comprobante (sitio web).
  urlConsulta: 'http://goodmoney.test/consulta',
  recaptcha: {
    siteKey: '6Leicb8mAAAAAO-xbD2-DJFaVJ0jEgElX18PbnDV',
  }
};
