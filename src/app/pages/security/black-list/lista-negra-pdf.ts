import { format } from 'date-fns';
import { BlackListReporte } from 'src/app/core/models';
import type { ColumnaPdf } from 'src/app/shared/utils/reporte-pdf';

export const COLUMNAS_PDF_LISTA_NEGRA: ColumnaPdf<BlackListReporte>[] = [
    { titulo: 'Documento', ancho: 40, valor: r => [r.documentTypeName, r.documentNumber].filter(Boolean).join(': ') },
    { titulo: 'Correo', ancho: 70, valor: r => r.email ?? '' },
    { titulo: 'Motivo', ancho: 110, valor: r => r.reason ?? '' },
    { titulo: 'Fecha de registro', ancho: 35, valor: r => format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm') },
];
