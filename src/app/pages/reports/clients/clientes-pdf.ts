import { TitleCasePipe } from '@angular/common';
import { ClienteReporte } from 'src/app/core/models';
import type { ColumnaPdf } from 'src/app/shared/utils/reporte-pdf';

const capitalizar = new TitleCasePipe();

export const COLUMNAS_PDF_CLIENTES: ColumnaPdf<ClienteReporte>[] = [
    { titulo: 'Nombre', ancho: 62, valor: c => capitalizar.transform(c.names ?? '') },
    { titulo: 'Documento', ancho: 38, valor: c => [c.documentType, c.documentNumber].filter(Boolean).join(': ') },
    { titulo: 'Correo', ancho: 68, valor: c => c.email ?? '' },
    { titulo: 'Teléfono', ancho: 26, valor: c => c.cellPhone ?? '' },
    { titulo: 'Correo validado', ancho: 28, valor: c => c.emailConfirmed ? 'Activo' : 'Inactivo' },
    { titulo: 'Cuenta', ancho: 22, valor: c => c.lockoutEnabled ? 'Bloqueada' : 'Activa' },
    { titulo: 'Lista negra', ancho: 21, valor: c => c.isBlackListed ? 'Sí' : 'No' },
];
