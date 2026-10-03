/** El backend (.NET) valida en inglés ("The field X must be…"); aquí se traducen antes de mostrarlos en el toast. */
const PATRONES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^One or more validation errors occurred\.?$/i,
    () => 'Se encontraron errores de validación.'],
  [/^The (.+?) field is required\.?$/i,
    m => `El campo ${m[1]} es obligatorio.`],
  [/^The field (.+?) must be a string with a minimum length of '?(\d+)'? and a maximum length of '?(\d+)'?\.?$/i,
    m => `El campo ${m[1]} debe tener entre ${m[2]} y ${m[3]} caracteres.`],
  [/^The field (.+?) must be a string (?:or array type )?with a maximum length of '?(\d+)'?\.?$/i,
    m => `El campo ${m[1]} no debe superar los ${m[2]} caracteres.`],
  [/^The field (.+?) must be a string (?:or array type )?with a minimum length of '?(\d+)'?\.?$/i,
    m => `El campo ${m[1]} debe tener al menos ${m[2]} caracteres.`],
  [/^The field (.+?) must be between (.+?) and (.+?)\.?$/i,
    m => `El campo ${m[1]} debe estar entre ${m[2]} y ${m[3]}.`],
  [/^The (.+?) field is not a valid e-?mail address\.?$/i,
    m => `El campo ${m[1]} no es un correo electrónico válido.`],
  [/^The (.+?) field is not a valid phone number\.?$/i,
    m => `El campo ${m[1]} no es un número de teléfono válido.`],
  [/^The (.+?) field is not a valid fully-qualified .+? URL\.?$/i,
    m => `El campo ${m[1]} no es una URL válida.`],
  [/^The field (.+?) must match the regular expression '.+?'\.?$/i,
    m => `El campo ${m[1]} no tiene el formato esperado.`],
  [/^'(.+?)' and '(.+?)' do not match\.?$/i,
    m => `Los campos ${m[1]} y ${m[2]} no coinciden.`],
  [/^The value '(.*?)' is not valid for (.+?)\.?$/i,
    m => `El valor '${m[1]}' no es válido para ${m[2]}.`],
  [/^The value '(.*?)' is not valid\.?$/i,
    m => `El valor '${m[1]}' no es válido.`],
  [/^The field (.+?) is invalid\.?$/i,
    m => `El campo ${m[1]} no es válido.`],
  [/^The (.+?) field is invalid\.?$/i,
    m => `El campo ${m[1]} no es válido.`],
  [/^The JSON value could not be converted to .+$/i,
    () => 'El valor enviado no tiene el formato esperado.'],
  [/^The input was not valid\.?$/i,
    () => 'Los datos enviados no son válidos.'],
  [/^A non-empty request body is required\.?$/i,
    () => 'La solicitud no puede estar vacía.'],
];

export function traducirErrorBackend(mensaje: string): string {
  for (const [patron, traducir] of PATRONES) {
    const match = mensaje.match(patron);
    if (match) return traducir(match);
  }
  return mensaje;
}
