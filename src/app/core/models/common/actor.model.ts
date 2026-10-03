/** Quien tramitó algo. Apunta a `AspNetUsers` y no a `Profiles`; sin correo ni foto (SEGURIDAD.md, hallazgo 18). */
export interface Actor {
  id: string;
  names: string;
}
