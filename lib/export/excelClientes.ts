type ClienteExportable = {
  nombre?: string | null;
  telefono?: string | null;
  email?: string | null;
  dni?: string | null;
  direccion?: string | null;
  piso?: string | null;
  departamento?: string | null;
  zona?: string | number | null;
  repartidor?: string | null;
  dia_reparto?: string | null;
  estado?: boolean;
  envases_prestados?: Array<{
    cantidad?: number | null;
    nombre_producto?: string | null;
    producto_nombre?: string | null;
  }> | null;
  cliente_vinculado?: { nombre?: string | null } | null;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const cell = (value: string | number | null | undefined): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
};

const formatearEnvases = (cliente: ClienteExportable): string => {
  const envases = cliente.envases_prestados || [];
  if (envases.length === 0) return "Sin envases";

  return envases
    .map((envase) => {
      const nombre = envase.producto_nombre || envase.nombre_producto || "Producto";
      const cantidad = Number(envase.cantidad) || 0;
      return `${cantidad} x ${nombre}`;
    })
    .join("; ");
};

const formatearDireccion = (cliente: ClienteExportable): string => {
  const extras = [
    cliente.piso ? `Piso ${cliente.piso}` : null,
    cliente.departamento ? `Depto ${cliente.departamento}` : null,
  ].filter(Boolean);

  if (!extras.length) return cliente.direccion || "";
  return `${cliente.direccion || ""} (${extras.join(" · ")})`;
};

type OpcionesExport = {
  nombreArchivo?: string;
  /** Resuelve el índice/código de zona al nombre visible. */
  resolverZona?: (zona: string | number | null | undefined) => string;
};

/** Genera y descarga un archivo Excel (.xls / SpreadsheetML) con todos los clientes dados. */
export function descargarClientesExcel(
  clientes: ClienteExportable[],
  opciones: OpcionesExport | string = "clientes"
): void {
  if (typeof window === "undefined") return;

  const { nombreArchivo = "clientes", resolverZona } =
    typeof opciones === "string" ? { nombreArchivo: opciones } : opciones;

  const headers = [
    "Nombre",
    "Teléfono",
    "Email",
    "DNI",
    "Dirección",
    "Zona",
    "Repartidor",
    "Día de Reparto",
    "Envases prestados",
    "Estado",
    "Cliente vinculado",
  ];

  const filas = clientes.map((cliente) => {
    const zonaNombre = resolverZona
      ? resolverZona(cliente.zona)
      : cliente.zona !== null && cliente.zona !== undefined
        ? String(cliente.zona)
        : "";

    return [
      cliente.nombre || "",
      cliente.telefono || "",
      cliente.email || "",
      cliente.dni || "",
      formatearDireccion(cliente),
      zonaNombre,
      cliente.repartidor || "",
      cliente.dia_reparto || "",
      formatearEnvases(cliente),
      cliente.estado === false ? "Inactivo" : "Activo",
      cliente.cliente_vinculado?.nombre || "",
    ];
  });

  const headerRow = `<Row>${headers.map((h) => cell(h)).join("")}</Row>`;
  const dataRows = filas
    .map((fila) => `<Row>${fila.map((v) => cell(v)).join("")}</Row>`)
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Clientes">
  <Table>
   ${headerRow}
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${nombreArchivo}_${fecha}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
