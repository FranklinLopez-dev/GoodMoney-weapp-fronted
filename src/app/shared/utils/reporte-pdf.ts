import jsPDF from 'jspdf';

export interface ColumnaPdf<T> {
    titulo: string;
    /** Peso relativo: las columnas se reparten el ancho útil de la página en esta proporción. */
    ancho: number;
    valor: (fila: T) => string;
}

export interface OpcionesReportePdf<T> {
    titulo: string;
    columnas: ColumnaPdf<T>[];
    empresa: string;
    logoBase64: string | null;
    filtros: string;
    nombreArchivo: string;
}

const MARGEN = 10;
const RELLENO = 2;
const ALTO_LINEA = 4;
const ALTO_ENCABEZADO = 8;
const PESO_NUMERACION = 12;

export function generarReportePdf<T>(filas: T[], opciones: OpcionesReportePdf<T>): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const anchoTabla = anchoPagina - MARGEN * 2;

    const pesoTotal = PESO_NUMERACION + opciones.columnas.reduce((total, columna) => total + columna.ancho, 0);
    const columnas = [
        { titulo: '#', ancho: PESO_NUMERACION, valor: (_: T, indice: number) => String(indice + 1) },
        ...opciones.columnas.map(columna => ({ ...columna, valor: (fila: T, _: number) => columna.valor(fila) })),
    ].map(columna => ({ ...columna, ancho: columna.ancho * anchoTabla / pesoTotal }));

    dibujarLogo(doc, opciones.logoBase64);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(opciones.empresa, anchoPagina / 2, 17, { align: 'center' });
    doc.setFontSize(16);
    doc.text(opciones.titulo, anchoPagina / 2, 26, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lineasFiltros: string[] = doc.splitTextToSize(`Filtros: ${opciones.filtros}`, anchoTabla - 50);
    doc.text(lineasFiltros, MARGEN, 35);
    doc.text(`Total: ${filas.length}`, anchoPagina - MARGEN, 35, { align: 'right' });

    let y = 35 + lineasFiltros.length * ALTO_LINEA;

    const dibujarEncabezado = (): void => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setFillColor(249, 180, 16);
        doc.setTextColor(0, 0, 0);
        doc.rect(MARGEN, y, anchoTabla, ALTO_ENCABEZADO, 'F');

        let x = MARGEN;
        for (const columna of columnas) {
            doc.text(columna.titulo, x + RELLENO, y + 5.2);
            x += columna.ancho;
        }

        y += ALTO_ENCABEZADO;
        doc.setFont('helvetica', 'normal');
    };

    dibujarEncabezado();
    doc.setDrawColor(200, 200, 200);

    filas.forEach((fila, indice) => {
        const celdas: string[][] = columnas.map(columna =>
            doc.splitTextToSize(columna.valor(fila, indice) || '-', columna.ancho - RELLENO * 2));
        const lineas = Math.max(...celdas.map(celda => celda.length));
        const altoFila = lineas * ALTO_LINEA + RELLENO * 2;

        if (y + altoFila > altoPagina - 15) {
            doc.addPage();
            y = 15;
            dibujarEncabezado();
        }

        if (indice % 2 === 1) {
            doc.setFillColor(245, 245, 245);
            doc.rect(MARGEN, y, anchoTabla, altoFila, 'F');
        }

        let x = MARGEN;
        celdas.forEach((celda, columna) => {
            doc.rect(x, y, columnas[columna].ancho, altoFila);
            celda.forEach((linea, numero) =>
                doc.text(linea, x + RELLENO, y + RELLENO + 3 + numero * ALTO_LINEA));
            x += columnas[columna].ancho;
        });

        y += altoFila;
    });

    const paginas = doc.getNumberOfPages();
    const generado = new Date().toLocaleString('es-PE');
    doc.setFontSize(8);
    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        const yPie = altoPagina - 8;
        doc.text(opciones.titulo, MARGEN, yPie);
        doc.text(generado, anchoPagina / 2, yPie, { align: 'center' });
        doc.text(`${pagina}/${paginas}`, anchoPagina - MARGEN, yPie, { align: 'right' });
    }

    doc.save(opciones.nombreArchivo);
}

function dibujarLogo(doc: jsPDF, logoBase64: string | null): void {
    if (!logoBase64) return;

    try {
        const logo = `data:image/jpeg;base64,${logoBase64}`;
        const { width, height } = doc.getImageProperties(logo);
        const alto = 15;
        doc.addImage(logo, MARGEN, 8, Math.min(alto * width / height, 50), alto);
    } catch {
        // Un logo ilegible no debe impedir la descarga del reporte.
    }
}
