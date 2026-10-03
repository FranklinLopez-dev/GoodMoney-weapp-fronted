import { HttpContextToken } from '@angular/common/http';

/**
 * Peticiones que manejan su propio error sin avisar al usuario: una foto que no
 * está no merece un aviso por cada imagen de la lista. El 401 se sigue
 * renovando como siempre.
 */
export const SIN_AVISOS = new HttpContextToken<boolean>(() => false);
