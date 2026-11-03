/** Fechas de todos los lunes del mes (mes 1–12). */
export function lunesDelMes(anio: number, mes: number): Date[] {
  const lunes: Date[] = [];
  const cursor = new Date(anio, mes - 1, 1);
  while (cursor.getDay() !== 1) {
    cursor.setDate(cursor.getDate() + 1);
  }
  while (cursor.getMonth() === mes - 1) {
    lunes.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    cursor.setDate(cursor.getDate() + 7);
  }
  return lunes;
}

function formatearFechaCorta(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cell(value: string | number | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  const text = value === null || value === undefined ? '' : String(value);
  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
}

export type ClienteHojaRuta = {
  nombre?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  piso?: string | null;
  departamento?: string | null;
  /** Repartidor de origen al migrar zona. */
  repartidor_anterior?: string | null;
  /** Deuda pendiente con ese repartidor (a cobrar por el nuevo). */
  deuda_anterior?: number | null;
};

function formatearDireccion(cliente: ClienteHojaRuta): string {
  const partes = [cliente.direccion || ''];
  if (cliente.piso) partes.push(`Piso ${cliente.piso}`);
  if (cliente.departamento) partes.push(`Dto ${cliente.departamento}`);
  return partes.filter(Boolean).join(' · ');
}

type OpcionesHojaRuta = {
  anio?: number;
  mes?: number;
  repartidor?: string;
  diaReparto?: string;
  nombreArchivo?: string;
  /** Agrega columnas de repartidor anterior y deuda a cobrar. */
  incluirDeudaDelegacion?: boolean;
};

/** Excel imprimible: Nombre | Dirección | Teléfono | lunes… | (opcional) deuda delegación. */
export function descargarHojaRutaExcel(
  clientes: ClienteHojaRuta[],
  opciones: OpcionesHojaRuta = {}
): void {
  if (typeof window === 'undefined') return;
  if (clientes.length === 0) {
    throw new Error('No hay clientes en la ruta para exportar');
  }

  const ahora = new Date();
  const anio = opciones.anio ?? ahora.getFullYear();
  const mes = opciones.mes ?? ahora.getMonth() + 1;
  const lunes = lunesDelMes(anio, mes);
  const conDeuda = Boolean(opciones.incluirDeudaDelegacion);

  const headers = [
    'Nombre',
    'Dirección',
    'Teléfono',
    ...lunes.map((fecha) => formatearFechaCorta(fecha)),
    ...(conDeuda ? ['Repartidor anterior', 'Deuda a cobrar'] : []),
  ];

  const filas = clientes.map((cliente) => [
    cliente.nombre || '',
    formatearDireccion(cliente),
    cliente.telefono || '',
    ...lunes.map(() => ''),
    ...(conDeuda
      ? [
          cliente.repartidor_anterior || 'Sin repartidor',
          Number(cliente.deuda_anterior || 0),
        ]
      : []),
  ]);

  const headerRow = `<Row>${headers.map((h) => cell(h)).join('')}</Row>`;
  const dataRows = filas
    .map((fila) => `<Row>${fila.map((v) => cell(v)).join('')}</Row>`)
    .join('');

  const sheetName = escapeXml(`Hoja ${(opciones.repartidor || 'ruta').slice(0, 20)}`);

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   ${headerRow}
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dia = opciones.diaReparto && opciones.diaReparto !== 'todos'
    ? opciones.diaReparto
    : 'todos';
  const repartidor = opciones.repartidor && opciones.repartidor !== 'todos'
    ? opciones.repartidor.replace(/\s+/g, '_')
    : 'todos';
  const base =
    opciones.nombreArchivo ||
    `hoja_ruta_${repartidor}_${dia}_${anio}-${String(mes).padStart(2, '0')}`;
  link.href = url;
  link.download = `${base}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
