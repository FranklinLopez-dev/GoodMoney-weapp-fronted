# Pendientes del rediseño

> **El plan completo del proyecto —seguridad, producto, configuración y
> verificaciones sin hacer— está en `GoodMoney-Backend/PENDIENTES.md`.**
> Este documento cubre solo lo de diseño.

## 0. Backoffice (2026-08-05): lo hecho y lo que queda

Con el archivo del Figma ya accesible (copia en la cuenta propia, fileKey
`Kw8CfU2kOL0toYMznIt37W`), se alinearon las vistas del backoffice del cliente:

**Hecho:**
- Lienzo global: contenido sobre crema con el mapamundi del Figma debajo
  (`_cliente.scss`, "Lienzo"); topbar blanca con filete.
- Cabecera de vista: `app-breadcrumb` ahora ES la banda amarilla con el título
  (frames 439/440). Las rutas sin `urls` no pintan banda (el flujo de cambio).
- Flujo "Cambiar dólares" recompuesto según frames 473/455/459/460: franja de
  pasos de borde a borde con los iconos recortados del mockup
  (`assets/images/iconos3d/tab-*.webp`), una sola columna centrada, tarjeta
  plomo `#7b7979` (medido del frame) en Cotiza con toggle Compra/Venta en
  píldora, filas USD/PEN con bandera a la izquierda, cupón con Aplicar verde
  dentro de la pastilla, botón "Iniciar operación" centrado; en Cotiza van
  debajo "Precio del dólar en Perú" y "Trabajamos con todos los bancos", y en
  el resto de pasos el banner "¡GANA Y CAMBIA CON GOOD MONEY!" (ilustración
  recortada del Figma en `assets/images/promos/banner-cupon.webp`). El éxito
  usa la insignia `badge-check.webp` y botones "Nueva cotización" / "Ir a
  operaciones".
- Estadísticas: las series del gráfico van en los colores del mockup
  (Compra `#2156F0`, Venta `#9AE238`), medidos del frame 440.
- Recursos cosechados del Figma en `assets/images/iconos3d/`: correo, campana
  y avatar 3D (con globo "1" horneado), nota, check, reloj 24h y banco "Otros".

**Decisiones tomadas (revisar si no convencen):**
- Los iconos 3D del header (correo/campana/avatar) NO se montaron: traen el
  globo rojo "1" pintado en el PNG y mentiría cuando el contador real sea otro.
  Se mantiene la terna de botones circulares del frame "header" de la
  biblioteca, que sí soporta contador dinámico.
- La navegación no se tocó: en el mockup "Inicio" es el cotizador y las
  estadísticas cuelgan de "Estadísticas"; en el app "Inicio" sigue siendo el
  dashboard con gráfico. Cambiarlo es routing, no estilo — decidirlo aparte.

**Falta del backoffice:**
- Frames 438/441/453 al detalle (tablas de operaciones y variantes de
  estadísticas): hoy heredan biblioteca + banda, sin revisión fina 1:1.
- Las pantallas de perfil (edición persona natural/jurídica, frames de la
  izquierda del canvas) y las vistas de notificaciones/ajustes de arriba.
- Frame 482/483 (biblioteca de componentes del backoffice): sin recorrer.

# Pendientes del rediseño (auth)

Lo que quedó a medias del rediseño de login y registro, con lo que hace falta
para cerrarlo. Si retomas esto en otra sesión, empieza por aquí.

## 1. Recursos: ya extraídos de Figma

Con el acceso de Editor ya resuelto, los recursos salieron del propio archivo
(`BackOffice- Perfil Usuario- copia`, frame 482) y están en el repo en WebP:

| Recurso | Ruta | Peso |
|---|---|---|
| Chanchito con monóculo | `src/assets/images/chanchito.webp` | 23 kB |
| Insignia de check verde | `src/assets/images/badge-check.webp` | 7 kB |
| Logo Good Money | `src/assets/images/logos/logo-good-money.webp` | 29 kB |

Los PNG originales pesaban 213, 237 y 251 kB; en WebP son 59 kB entre los tres.
**Si añades más recursos, exporta también a WebP** (`cwebp -q 85`) en vez de
dejar el PNG de Figma.

`auth-aside` mantiene el guardia `artOk`: si el archivo faltara, la ilustración
simplemente no se pinta en vez de dejar el icono de imagen rota.

## 2. Código de verificación: lo que sí quedó hecho

El paso 1 del registro pide un código de 6 dígitos enviado al correo, como en el
diseño. Necesitó backend nuevo, que ya está en `GoodMoney-Backend`:

- `POST /api/accounts/send-verification-code` y `POST /api/accounts/verify-code`
- Tabla `EmailVerificationCodes` (migración en los dos motores)
- Plantilla de correo `EMAIL_VERIFICATION`
- `create/natural` y `create/juridico` rechazan correos sin verificar

**Falta probar el envío real por SMTP.** Todo lo demás está verificado: los
endpoints responden, las plantillas renderizan y el flujo de etapas avanza.

## 3. Lo que falta del Figma

- ~~El mapamundi del fondo~~ **Resuelto.** Exportado del archivo (nodo
  `2638:1515`, 1182×707) a `src/assets/images/backgrounds/mapa-mundo.webp`
  (17 kB). Su fondo es el mismo `#F5F5F5` del token crema, así que se funde con
  el lienzo sin recortes ni opacidades. Lo consume `_cliente.scss` ("Lienzo").
- **Nacionalidad** (paso 2 del diseño) **no se implementó**: el backend no tiene
  columna para guardarla. Hace falta añadirla a `EProfile`, su migración en los
  dos motores y meterla en el payload de registro.
- **Añadir cuenta USD-PEN** y su variante **mancomunada** están diseñadas en el
  frame 482 y no se tocaron: son pantallas de dentro del backoffice, no de auth.
- `verify-email` y `confirm-account` **quedaron huérfanas**: ya nadie navega a
  ellas porque el correo se verifica antes de crear la cuenta. Sus rutas siguen
  ahí por si algún correo antiguo enlaza a ellas; se pueden borrar cuando no
  queden enlaces vivos.

## 4. Desviaciones respecto al mockup, y por qué

- **La columna derecha del registro dice "¿Ya tienes una cuenta? / Iniciar
  sesión"**, no "¿Aún no tienes una cuenta? / Crear cuenta" como el PNG. En el
  mockup se quedó el bloque del login copiado tal cual; ofrecer "Crear cuenta"
  a quien ya está creando una cuenta no tiene sentido.
- **El enlace "Ir a Good Money" pasó al footer** (icono de globo). El diseño
  quitó la barra superior, que era donde vivía; sin moverlo se perdía el acceso
  al sitio público.
- **La fecha de nacimiento está con el documento** (paso 3), no con el celular.
  El diseño no la pinta en ningún paso, pero el API la exige; junto al DNI es
  donde menos desentona. El celular sí está en el paso 1, como en el diseño.
- **La elección "Persona Natural / Empresa" no existe en el Figma**: el diseño
  entra directo al paso 1. Se mantuvo porque el registro de empresa lo necesita,
  rehecha como tarjetas que dicen qué documento pide cada una y cuánto tarda.
- **El registro de empresa no está diseñado**; sus cuatro etapas siguen el mismo
  reparto que el de persona natural, por sentido.
- **El radio de inputs, botones y chip es 12 px**, medido sobre los PNG con las
  herramientas de `img/` (`bordes.swift`, `radio.swift`). A ojo parecen más
  redondeados de lo que son.

## 5. Cabos sueltos menores

- `app-store-links.component.ts` ya no lo usa nadie: el diseño sustituyó esa
  tarjeta por la ilustración. Sus estilos se fueron de `_auth.scss`, así que si
  se vuelve a usar hay que rehacerlos o borrar el componente.
- El resto del backoffice (todo lo que no es auth) sigue con el radio y los
  colores de la plantilla comprada. El rediseño solo llegó a las pantallas de
  autenticación.

---

## Sesión del 6 de agosto de 2026

### Hecho

- **Topbar** según el frame `Frame 343`: los tres iconos 3D recortados de su
  globo rojo pintado —en el archivo de Figma no hay versión limpia—, sin aro,
  a 48/40 px, con el contador real en rojo y sin nada encima cuando no hay
  avisos. El saludo pasó a la barra.
- **Franjas de borde a borde**: la app venía con `boxed: true`, que topaba el
  contenido a 1200 px y lo centraba dentro de 1252. De ahí los 26 px de blanco a
  cada lado que partían las bandas amarillas.
- **Franja al pie pegada abajo**: `min-height` del envoltorio corregido
  (`100vh - 70px`, el alto real de la barra; pedía 100).
- **Avisos opacos**: los tonos `-300` de la biblioteca son el color al 50 % de
  opacidad; sobre una tarjeta el aviso se transparentaba. Ahora usan el `-500`.
- **Iconos por defecto de perfil**: los 3D del diseño (avatar y edificio) en vez
  del busto gris de la plantilla. El arreglo va en la directiva `fallbackImg`,
  así que aplica en toda la app.
- **Vacío de Beneficios** (frame 453) con su ilustración transparente y la banda
  de cabecera, que faltaba.
- **Contadores de operaciones** al pie junto al paginador (frame 443).
- **Configuración** reagrupada: portada con tarjetas por área y permisos, y las
  secciones separadas de la ficha de Empresa.
- **`LOCALE_ID` en es-PE**: las fechas salían "Thursday 1 de January" en **todas**
  las tablas del panel. `main.ts` registraba el locale pero nadie le decía a
  Angular que lo usara.

### Falta

- Icono del vacío del chat: el frame 466 usa un 3D de bocadillos distinto.
- Columna **Estado** en la tabla de operaciones y el vacío de la lista.
- Detalle de perfil: iconos y composición contra su frame.
- Pantallas de operador (`/operations/web`) y Reportes, sin revisión 1:1.
- Menú plegado a iconos: la regla está escrita pero **no comprobada**.

---

## Sesión del 6 de agosto de 2026 (tarde)

### Hecho

- **"Mi cuenta" en el menú lateral** gana dos entradas: *Mis avisos*
  (`/account/notifications`) y *Seguridad de mi cuenta* (`/account/security`).
  Van sin permisos a propósito: son la cuenta propia, no el backoffice. El
  módulo `/security` sigue siendo el del equipo, con sus permisos.
- **Verificación en dos pasos** con su pantalla: estado, activación en dos pasos
  (contraseña → código del correo) y desactivación con contraseña.
- **Preferencias de aviso**: rejilla de tipo × canal, con los avisos obligatorios
  bloqueados y explicados. El catálogo lo sirve el API.

### Un problema del sistema de diseño, encontrado por el camino

**Los tokens `--mdc-*-button-*` ya no los lee nadie** en la versión de Material
que usa el panel. Un botón relleno toma el fondo de `--mat-sys-primary`, así que
el bloque de `_biblioteca.scss` (líneas ~118-153) que pinta
`.mat-mdc-unelevated-button.mat-primary` y `.mat-warn` **no tiene ningún efecto**:
comprobado en el navegador, con la variable resuelta a `#CA4444` y el fondo
pintado de `#87BA30`.

Consecuencia práctica: **`color="warn"` sale verde**, igual que un botón de
confirmar. En la pantalla de seguridad se resolvió a mano con el token de error,
pero el bloque entero de `_biblioteca.scss` pide una revisión: hoy los colores
que la lámina reserva a "aprobar / rechazar" no llegan a la pantalla.

Lo que sí funciona es `.mat-error` en botones de contorno, porque
`override-component/_button.scss` lo escribe con `color:` directo y no por token.

### Cabo suelto menor cerrado

Un perfil sin foto componía `<api>/null` y el navegador pedía esa URL: un 404 en
cada carga de página, y otro por cada fila del listado de perfiles. Ya se pasa
cadena vacía y `fallbackImg` hace su trabajo sin pedir nada.
