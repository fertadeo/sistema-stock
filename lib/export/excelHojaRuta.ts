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

function cellString(value: string | null | undefined, styleId: string): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
}

function cellNumber(value: number, styleId: string): string {
  const n = Number.isFinite(value) ? value : 0;
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${n}</Data></Cell>`;
}

function cellEmpty(styleId: string): string {
  return `<Cell ss:StyleID="${styleId}"/>`;
}

const BORDES = `
      <Borders>
       <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
       <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
       <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
       <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#64748B"/>
      </Borders>`;

const STYLES_XML = `
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Titulo">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Subtitulo">
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#475569"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   ${BORDES}
  </Style>
  <Style ss:ID="HeaderFecha">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   ${BORDES}
  </Style>
  <Style ss:ID="CeldaTexto">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/>
   ${BORDES}
  </Style>
  <Style ss:ID="CeldaCentro">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   ${BORDES}
  </Style>
  <Style ss:ID="CeldaNum">
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   ${BORDES}
  </Style>
  <Style ss:ID="CeldaEscritura">
   <Font ss:FontName="Calibri" ss:Size="10"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   ${BORDES}
  </Style>
  <Style ss:ID="CeldaDinero">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   ${BORDES}
  </Style>
 </Styles>`;

export type ClienteHojaRuta = {
  nombre?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  piso?: string | null;
  departamento?: string | null;
  repartidor?: string | null;
  /** Repartidor de origen al migrar zona. */
  repartidor_anterior?: string | null;
  /** Deuda pendiente con ese repartidor (a cobrar por el nuevo). */
  deuda_anterior?: number | null;
};

export type HojaRutaGrupo = {
  /** Nombre de la pestaña / repartidor de esta hoja. */
  repartidor: string;
  clientes: ClienteHojaRuta[];
};

function formatearDireccion(cliente: ClienteHojaRuta): string {
  const partes = [cliente.direccion || ''];
  if (cliente.piso) partes.push(`Piso ${cliente.piso}`);
  if (cliente.departamento) partes.push(`Dto ${cliente.departamento}`);
  return partes.filter(Boolean).join(' · ');
}

function nombreHojaSeguro(nombre: string, usados: Set<string>): string {
  let base = (nombre || 'Ruta').trim().slice(0, 28) || 'Ruta';
  // Excel no permite : \ / ? * [ ]
  base = base.replace(/[:\\/?*\[\]]/g, ' ').replace(/\s+/g, ' ').trim() || 'Ruta';
  let candidato = base;
  let n = 2;
  while (usados.has(candidato.toLowerCase())) {
    const sufijo = ` (${n})`;
    candidato = `${base.slice(0, Math.max(1, 28 - sufijo.length))}${sufijo}`;
    n += 1;
  }
  usados.add(candidato.toLowerCase());
  return candidato;
}

type OpcionesHojaRuta = {
  anio?: number;
  mes?: number;
  repartidor?: string;
  /** Nombre de la zona (aparece en el título). */
  zona?: string;
  diaReparto?: string;
  nombreArchivo?: string;
  /** Agrega columnas de repartidor anterior y deuda a cobrar. */
  incluirDeudaDelegacion?: boolean;
};

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function construirWorksheetXml(
  clientes: ClienteHojaRuta[],
  opts: {
    sheetName: string;
    titulo: string;
    subtitulo: string;
    lunes: Date[];
    conDeuda: boolean;
  }
): string {
  const { sheetName, titulo, subtitulo, lunes, conDeuda } = opts;
  const colCount = 4 + lunes.length + (conDeuda ? 2 : 0) + 1;

  const columnasXml = [
    `<Column ss:Width="28"/>`,
    `<Column ss:Width="118"/>`,
    `<Column ss:Width="168"/>`,
    `<Column ss:Width="78"/>`,
    ...lunes.map(() => `<Column ss:Width="58"/>`),
    ...(conDeuda ? [`<Column ss:Width="92"/>`, `<Column ss:Width="72"/>`] : []),
    `<Column ss:Width="88"/>`,
  ].join('\n   ');

  const headerLabels = [
    '#',
    'Nombre',
    'Dirección',
    'Teléfono',
    ...lunes.map((fecha) => formatearFechaCorta(fecha)),
    ...(conDeuda ? ['Rep. anterior', 'Deuda $'] : []),
    'Observaciones',
  ];

  const headerCells = headerLabels
    .map((label, index) => {
      const esFecha = index >= 4 && index < 4 + lunes.length;
      return cellString(label, esFecha ? 'HeaderFecha' : 'Header');
    })
    .join('');

  const dataRows = clientes
    .map((cliente, index) => {
      const celdas = [
        cellNumber(index + 1, 'CeldaNum'),
        cellString(cliente.nombre || '', 'CeldaTexto'),
        cellString(formatearDireccion(cliente), 'CeldaTexto'),
        cellString(cliente.telefono || '', 'CeldaCentro'),
        ...lunes.map(() => cellEmpty('CeldaEscritura')),
        ...(conDeuda
          ? [
              cellString(
                cliente.repartidor_anterior || cliente.repartidor || 'Sin repartidor',
                'CeldaTexto'
              ),
              Number(cliente.deuda_anterior || 0) > 0
                ? cellNumber(Number(cliente.deuda_anterior), 'CeldaDinero')
                : cellEmpty('CeldaEscritura'),
            ]
          : []),
        cellEmpty('CeldaEscritura'),
      ];
      return `<Row ss:Height="30">${celdas.join('')}</Row>`;
    })
    .join('\n   ');

  return `
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table ss:DefaultRowHeight="18">
   ${columnasXml}
   <Row ss:Height="24">
    <Cell ss:StyleID="Titulo" ss:MergeAcross="${colCount - 1}"><Data ss:Type="String">${escapeXml(titulo)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="Subtitulo" ss:MergeAcross="${colCount - 1}"><Data ss:Type="String">${escapeXml(subtitulo)}</Data></Cell>
   </Row>
   <Row ss:Height="26">${headerCells}</Row>
   ${dataRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape" x:CenterHorizontal="1"/>
    <Header x:Margin="0.2"/>
    <Footer x:Margin="0.25" x:Data="&amp;C&amp;P / &amp;N"/>
    <PageMargins x:Bottom="0.4" x:Left="0.3" x:Right="0.3" x:Top="0.35"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
   </Print>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>3</SplitHorizontal>
   <TopRowBottomPane>3</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>`;
}

function dispararDescarga(xml: string, nombreArchivo: string): void {
  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nombreArchivo}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Una o varias hojas de ruta en el mismo Excel (una pestaña por repartidor).
 * Pensado para imprimir por zona × repartidor.
 */
export function descargarHojasRutaExcel(
  grupos: HojaRutaGrupo[],
  opciones: OpcionesHojaRuta = {}
): void {
  if (typeof window === 'undefined') return;
  const hojas = grupos.filter((g) => g.clientes.length > 0);
  if (hojas.length === 0) {
    throw new Error('No hay clientes en la ruta para exportar');
  }

  const ahora = new Date();
  const anio = opciones.anio ?? ahora.getFullYear();
  const mes = opciones.mes ?? ahora.getMonth() + 1;
  const lunes = lunesDelMes(anio, mes);
  const conDeuda = Boolean(opciones.incluirDeudaDelegacion);
  const mesNombre = NOMBRES_MES[mes - 1] || String(mes);
  const zonaNombre = (opciones.zona || '').trim();
  const usados = new Set<string>();

  const worksheets = hojas
    .map((grupo) => {
      const rep = (grupo.repartidor || 'Sin repartidor').trim() || 'Sin repartidor';
      const sheetName = nombreHojaSeguro(rep, usados);
      const titulo = [
        'Hoja de ruta',
        zonaNombre ? `Zona ${zonaNombre}` : null,
        rep,
        `${mesNombre} ${anio}`,
      ]
        .filter(Boolean)
        .join(' · ');
      const subtitulo = conDeuda
        ? `Zona y repartidor. Completá a mano las fechas. Deuda = fiado del repartidor anterior.`
        : `Zona y repartidor. Completá a mano las columnas de fecha (venta / cobro / notas).`;
      return construirWorksheetXml(grupo.clientes, {
        sheetName,
        titulo,
        subtitulo,
        lunes,
        conDeuda,
      });
    })
    .join('\n');

  const tituloDoc = zonaNombre
    ? `Hojas de ruta · ${zonaNombre} · ${mesNombre} ${anio}`
    : `Hojas de ruta · ${mesNombre} ${anio}`;

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(tituloDoc)}</Title>
 </DocumentProperties>
 ${STYLES_XML}
 ${worksheets}
</Workbook>`;

  const dia =
    opciones.diaReparto && opciones.diaReparto !== 'todos'
      ? opciones.diaReparto
      : 'todos';
  const zonaSlug = zonaNombre
    ? zonaNombre.replace(/\s+/g, '_')
    : opciones.repartidor && opciones.repartidor !== 'todos'
      ? opciones.repartidor.replace(/\s+/g, '_')
      : 'todos';
  const base =
    opciones.nombreArchivo ||
    `hoja_ruta_${zonaSlug}_${dia}_${anio}-${String(mes).padStart(2, '0')}`;
  dispararDescarga(xml, base);
}

/** Compat: una sola hoja (un repartidor). */
export function descargarHojaRutaExcel(
  clientes: ClienteHojaRuta[],
  opciones: OpcionesHojaRuta = {}
): void {
  descargarHojasRutaExcel(
    [
      {
        repartidor: opciones.repartidor || 'Ruta',
        clientes,
      },
    ],
    opciones
  );
}
