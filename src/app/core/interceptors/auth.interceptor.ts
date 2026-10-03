import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, switchMap, throwError } from 'rxjs';
import { getToken } from '../auth/token.utils';
import { AuthService } from '../auth/auth.service';
import { traducirErrorBackend } from '../i18n/errores-backend-es';
import { environment } from 'src/environments/environment';
import { SIN_AVISOS } from './sin-avisos';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const toastr = inject(ToastrService);
  const service = inject(AuthService);
  const token = getToken();

  // El Bearer solo viaja a la propia API: los assets (i18n, ubigeos) y cualquier tercero futuro no lo reciben.
  const authReq = token && perteneceALaApi(req.url)
    ? req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (req.context.get(SIN_AVISOS) && error.status !== 401) {
        return throwError(() => error);
      }

      let parsedError: any;

      try {
        parsedError = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
      } catch {
        parsedError = error.error;
      }

      const status = error.status;
      const defaultMsg = traducirErrorBackend(parsedError?.title || parsedError?.message || 'Error inesperado');

      switch (status) {

        case 0:
          toastr.error(
            'No se pudo conectar con el servidor',
            'Sin conexión'
          );
          break;

        case 400:
          if (parsedError?.errors) {
            const messages = extractValidationErrors(parsedError.errors);
            messages.forEach((msg) => toastr.error(msg, 'Error de validación'));
          } else if (typeof parsedError === 'string') {
            toastr.warning(traducirErrorBackend(parsedError), 'Advertencia');
          } else {
            toastr.warning(traducirErrorBackend(parsedError?.title || parsedError?.message || 'Solicitud incorrecta'), 'Advertencia');
          }
          break;
        case 401:
          // Antes de echar al usuario se renueva y se repite la peticion. Nunca sobre /refresh ni login: seria un bucle.
          if (!esDeAutenticacion(req.url)) {
            return service.refreshSession().pipe(
              switchMap(res => next(
                perteneceALaApi(req.url)
                  ? req.clone({ setHeaders: { Authorization: `Bearer ${res.token}` } })
                  : req
              )),
              catchError(() => {
                service.logout();
                toastr.warning('Tu sesión expiró', 'Sesión finalizada');
                return throwError(() => error);
              })
            );
          }

          service.logout();
          toastr.warning(
            'Tu sesión expiró',
            'Sesión finalizada'
          );
          break;

        case 403:
          toastr.error(
            'No tienes permisos para esta acción',
            'Acceso denegado'
          );
          break;

        case 404:
          if (parsedError?.errors) {
            const messages = extractValidationErrors(parsedError.errors);
            messages.forEach((msg) => toastr.error(msg, 'Error de validación'));
          } else if (typeof parsedError === 'string') {
            // Un 404 no es sesion caducada: cerrarla aqui tapaba el aviso real con dos "sesión expiró".
            if (parsedError.startsWith('Perfil no encontrado')) {
              toastr.error(
                'Tu usuario no tiene un perfil asociado. Contacta con soporte.',
                'No podemos cargar tu cuenta'
              );

              // Sin perfil el panel no monta y la pantalla se queda en blanco para siempre.
              service.logout();
              router.navigate(['/authentication/login']);
            } else {
              toastr.warning(traducirErrorBackend(parsedError), 'Advertencia');
            }
          } else {
            toastr.warning(traducirErrorBackend(parsedError?.title || parsedError?.message || 'Recurso no encontrado'), 'Advertencia');
          }
          break;
        case 422:
          toastr.warning(
            traducirErrorBackend(error.error?.message || 'Error de validación'),
            'Datos inválidos'
          );
          break;

        case 500:
          toastr.error(
            'Error interno del servidor',
            'Servidor'
          );
          break;

        default:
          toastr.error(
            defaultMsg || 'Error inesperado',
            'Error'
          );
      }

      return throwError(() => error);
    })
  );


};

/** Solo las peticiones a la API configurada llevan el token; nada de terceros ni assets estaticos. */
function perteneceALaApi(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

/** Endpoints donde reintentar tras renovar no tiene sentido y provocaria un bucle. */
function esDeAutenticacion(url: string): boolean {
  return url.includes('/api/accounts/refresh')
    || url.includes('/api/accounts/login')
    || url.includes('/api/accounts/logout');
}

function extractValidationErrors(errors: { [key: string]: string[] }): string[] {
  const messages: string[] = [];
  for (const key in errors) {
    if (errors.hasOwnProperty(key)) {
      messages.push(...errors[key].map(traducirErrorBackend));
    }
  }
  return messages;
}
