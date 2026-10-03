export type ClienteImportable = {
  id: number;
  nombre?: string | null;
  telefono?: string | null;
  email?: string | null;
  dni?: string | null;
  direccion?: string | null;
  piso?: string | null;
  departamento?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  zona?: string | number | null;
  repartidor?: string | null;
  dia_reparto?: string | null;
  estado?: boolean;
  envasesTexto?: string;
  vinculadoTexto?: string;
};

export type CambioCampo = {
  campo: string;
  anterior: string;
  nuevo: string;
};

export type DatosActualizacion = {
  dni: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  piso: string | null;
  departamento: string | null;
  zonaId: number | null;
  repartidor: string;
  dia_reparto: string;
  latitud: number | string | null;
  longitud: number | string | null;
};

export type ActualizacionCliente = {
  fila: number;
  id: number;
  nombre: string;
  cambios: CambioCampo[];
  datos: DatosActualizacion;
  /** Presente solo si el estado cambió. Se envía por separado del resto. */
  estado?: boolean;
  aviso?: string;
};

export type FilaObservada = {
  fila: number;
  nombre: string;
  motivo: string;
};

export type ResumenImportacion = {
  totalFilas: number;
  actualizaciones: ActualizacionCliente[];
  sinCambios: number;
  observaciones: FilaObservada[];
};

export type CatalogosImportacion = {
  zonas: { nombre: string }[];
  repartidores: string[];
  diasReparto: string[];
};

type Campo =
  | "id"
  | "nombre"
  | "telefono"
  | "email"
  | "dni"
  | "direccion"
  | "piso"
  | "departamento"
  | "zona"
  | "repartidor"
  | "dia_reparto"
  | "envases"
  | "estado"
  | "vinculado";

type FilaExcel = {
  fila: number;
} & Partial<Record<Campo, string>>;

const ALIAS: Record<string, Campo> = {
  id: "id",
  nombre: "nombre",
  telefono: "telefono",
  email: "email",
  dni: "dni",
  direccion: "direccion",
  piso: "piso",
  departamento: "departamento",
  depto: "departamento",
  zona: "zona",
  repartidor: "repartidor",
  "dia de reparto": "dia_reparto",
  "envases prestados": "envases",
  estado: "estado",
  "cliente vinculado": "vinculado",
};

const compactar = (valor: unknown): string =>
  (valor == null ? "" : String(valor)).trim().replace(/\s+/g, " ");

const clave = (valor: string): string =>
  compactar(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const distinto = (a: unknown, b: unknown): boolean => compactar(a) !== compactar(b);

const telefonoComparable = (valor: string): string => {
  const texto = compactar(valor);
  const sinDecimal = /^\d+\.0$/.test(texto) ? texto.slice(0, -2) : texto;
  return sinDecimal.replace(/[\s-]/g, "");
};

const nombreZona = (
  zona: string | number | null | undefined,
  zonas: { nombre: string }[]
): string => {
  if (zona == null || zona === "") return "";
  const indice = parseInt(String(zona), 10);
  if (Number.isNaN(indice)) return compactar(zona);
  return zonas[indice]?.nombre || "";
};

const resolverZonaId = (
  nombre: string,
  zonas: { nombre: string }[]
): number | null | "invalida" => {
  const normalizado = clave(nombre);
  if (!normalizado || normalizado === "sin zona") return null;
  const indice = zonas.findIndex((zona) => clave(zona.nombre) === normalizado);
  return indice === -1 ? "invalida" : indice;
};

const resolverCatalogo = (
  valor: string,
  opciones: string[],
  actual: string,
  vacios: string[]
): string | null => {
  const texto = compactar(valor);
  if (!texto || vacios.includes(clave(texto))) return "";
  const canonico = opciones.find((opcion) => clave(opcion) === clave(texto));
  if (canonico) return canonico;
  if (clave(texto) === clave(actual)) return compactar(actual);
  return null;
};

const parseEstado = (valor: string): boolean | null => {
  const normalizado = clave(valor);
  if (["activo", "si", "true", "1"].includes(normalizado)) return true;
  if (["inactivo", "no", "false", "0"].includes(normalizado)) return false;
  return null;
};

const direccionExportadaAnterior = (cliente: ClienteImportable): string => {
  const extras = [
    cliente.piso ? `Piso ${cliente.piso}` : null,
    cliente.departamento ? `Depto ${cliente.departamento}` : null,
  ].filter(Boolean);
  const base = compactar(cliente.direccion);
  if (!extras.length) return base;
  return `${base} (${extras.join(" · ")})`;
};

const localName = (nodo: Element): string => nodo.localName || nodo.nodeName.split(":").pop() || "";

const porNombre = (raiz: Document | Element, nombre: string): Element[] =>
  Array.from(raiz.getElementsByTagName("*")).filter((nodo): nodo is Element => localName(nodo) === nombre);

const parseXml = (xml: string): Document => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("No se pudo leer el contenido del Excel.");
  }
  return doc;
};

const columnaDesdeRef = (ref: string): number => {
  const letras = ref.replace(/[0-9]/g, "").toUpperCase();
  let indice = 0;
  for (const letra of letras) {
    indice = indice * 26 + (letra.charCodeAt(0) - 64);
  }
  return indice - 1;
};

const leerSharedStrings = (xml: string): string[] => {
  const doc = parseXml(xml);
  return porNombre(doc, "si").map((item) =>
    porNombre(item, "t").map((nodo) => nodo.textContent || "").join("")
  );
};

const leerHojaXlsx = (xml: string, shared: string[]): string[][] => {
  const doc = parseXml(xml);
  return porNombre(doc, "row").map((fila) => {
    const valores: string[] = [];
    const celdas = Array.from(fila.children).filter(
      (nodo): nodo is Element => nodo instanceof Element && localName(nodo) === "c"
    );

    celdas.forEach((celda) => {
      const ref = celda.getAttribute("r") || "";
      const columna = ref ? columnaDesdeRef(ref) : valores.length;
      while (valores.length < columna) valores.push("");

      const tipo = celda.getAttribute("t") || "";
      const valor = porNombre(celda, "v")[0]?.textContent ?? "";
      let texto = valor;
      if (tipo === "s") texto = shared[parseInt(valor, 10)] ?? "";
      else if (tipo === "inlineStr") {
        texto = porNombre(celda, "t").map((nodo) => nodo.textContent || "").join("");
      }
      valores[columna] = compactar(texto);
    });

    return valores;
  });
};

const leerSpreadsheetMl = (xml: string): string[][] => {
  const doc = parseXml(xml);
  return porNombre(doc, "Row").map((fila) => {
    const valores: string[] = [];
    let columna = 0;
    const celdas = Array.from(fila.children).filter(
      (nodo): nodo is Element => nodo instanceof Element && localName(nodo) === "Cell"
    );

    celdas.forEach((celda) => {
      const indice = celda.getAttribute("ss:Index") || celda.getAttribute("Index");
      if (indice) {
        const destino = parseInt(indice, 10) - 1;
        while (columna < destino) {
          valores.push("");
          columna += 1;
        }
      }
      const dato = porNombre(celda, "Data")[0];
      valores.push(compactar(dato?.textContent ?? ""));
      columna += 1;
    });

    return valores;
  });
};

const leerHtml = (html: string): string[][] => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("tr")).map((fila) =>
    Array.from(fila.querySelectorAll("th,td")).map((celda) => compactar(celda.textContent ?? ""))
  );
};

const buscarFinDirectorio = (bytes: Uint8Array): number => {
  const minimo = Math.max(0, bytes.length - 22 - 65536);
  for (let i = bytes.length - 22; i >= minimo; i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }
  return -1;
};

const inflar = async (datos: Uint8Array): Promise<Uint8Array> => {
  const Descompresor = (
    globalThis as typeof globalThis & {
      DecompressionStream: new (format: string) => ReadableWritablePair;
    }
  ).DecompressionStream;
  const stream = new Blob([datos]).stream().pipeThrough(new Descompresor("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const leerXmlsXlsx = async (buffer: ArrayBuffer): Promise<Map<string, string>> => {
  const bytes = new Uint8Array(buffer);
  const vista = new DataView(buffer);
  const fin = buscarFinDirectorio(bytes);
  if (fin < 0) throw new Error("El archivo Excel está dañado.");

  const cantidad = vista.getUint16(fin + 10, true);
  let cursor = vista.getUint32(fin + 16, true);
  const archivos = new Map<string, string>();
  const decoder = new TextDecoder();

  for (let i = 0; i < cantidad; i += 1) {
    if (vista.getUint32(cursor, true) !== 0x02014b50) break;
    const metodo = vista.getUint16(cursor + 10, true);
    const comprimido = vista.getUint32(cursor + 20, true);
    const largoNombre = vista.getUint16(cursor + 28, true);
    const largoExtra = vista.getUint16(cursor + 30, true);
    const largoComentario = vista.getUint16(cursor + 32, true);
    const offsetLocal = vista.getUint32(cursor + 42, true);
    const nombre = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + largoNombre));
    const nombreLocal = vista.getUint16(offsetLocal + 26, true);
    const extraLocal = vista.getUint16(offsetLocal + 28, true);
    const inicio = offsetLocal + 30 + nombreLocal + extraLocal;
    const bloque = bytes.subarray(inicio, inicio + comprimido);
    const crudo = metodo === 0 ? bloque : metodo === 8 ? await inflar(bloque) : null;
    if (crudo && nombre.endsWith(".xml")) archivos.set(nombre.replace(/\\/g, "/"), decoder.decode(crudo));
    cursor += 46 + largoNombre + largoExtra + largoComentario;
  }

  return archivos;
};

const matrizDesdeXlsx = async (buffer: ArrayBuffer): Promise<string[][]> => {
  const archivos = await leerXmlsXlsx(buffer);
  const hoja =
    archivos.get("xl/worksheets/sheet1.xml") ||
    Array.from(archivos.keys())
      .filter((nombre) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(nombre))
      .sort()[0];
  if (!hoja) throw new Error("El Excel no tiene una hoja de clientes.");
  const shared = archivos.get("xl/sharedStrings.xml");
  return leerHojaXlsx(archivos.get(hoja) || "", shared ? leerSharedStrings(shared) : []);
};

const matrizDesdeArchivo = async (file: File): Promise<string[][]> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const inicio = new TextDecoder().decode(bytes.slice(0, 300)).replace(/^\uFEFF/, "").trim();

  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return matrizDesdeXlsx(buffer);
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) {
    throw new Error(
      "Este Excel está en formato binario viejo. Guardalo como Libro de Excel (.xlsx) y volvé a importarlo."
    );
  }
  if (inicio.includes("<Workbook") || inicio.includes(":Worksheet")) {
    return leerSpreadsheetMl(new TextDecoder().decode(bytes));
  }
  if (/<table[\s>]/i.test(inicio) || /<html[\s>]/i.test(inicio)) {
    return leerHtml(new TextDecoder().decode(bytes));
  }

  throw new Error(
    "No se reconoce el archivo. Exportá los clientes desde esta pantalla, editalo y volvé a importarlo. Si Excel cambia el formato, guardalo como .xlsx."
  );
};

const filasDesdeMatriz = (matriz: string[][]): { filas: FilaExcel[]; columnas: Set<Campo> } => {
  const encabezado = matriz.find((fila) => fila.some((celda) => compactar(celda)));
  if (!encabezado) throw new Error("El archivo está vacío.");

  const inicio = matriz.indexOf(encabezado);
  const columnasIndice: { campo: Campo; index: number }[] = [];
  encabezado.forEach((titulo, index) => {
    const campo = ALIAS[clave(titulo)];
    if (campo && !columnasIndice.some((item) => item.campo === campo)) {
      columnasIndice.push({ campo, index });
    }
  });

  const columnas = new Set(columnasIndice.map((item) => item.campo));
  if (!columnas.has("nombre")) {
    throw new Error(
      "No se reconoce el archivo. Usá el Excel exportado desde Clientes, con la columna Nombre."
    );
  }

  const filas: FilaExcel[] = [];
  matriz.slice(inicio + 1).forEach((fila, desplazamiento) => {
    if (fila.every((celda) => !compactar(celda))) return;
    const registro: FilaExcel = { fila: inicio + desplazamiento + 2 };
    columnasIndice.forEach(({ campo, index }) => {
      registro[campo] = compactar(fila[index] ?? "");
    });
    filas.push(registro);
  });

  if (filas.length === 0) throw new Error("El archivo no tiene clientes para importar.");
  return { filas, columnas };
};

const buscarCliente = (
  fila: FilaExcel,
  columnas: Set<Campo>,
  clientes: ClienteImportable[]
): { cliente: ClienteImportable } | { motivo: string } => {
  if (columnas.has("id") && compactar(fila.id)) {
    const id = parseInt(compactar(fila.id), 10);
    if (Number.isNaN(id)) return { motivo: `El ID "${fila.id}" no es válido.` };
    const cliente = clientes.find((item) => item.id === id);
    if (!cliente) return { motivo: `No existe un cliente con ID ${id}.` };
    return { cliente };
  }

  const dni = compactar(fila.dni);
  if (dni) {
    const coincidencias = clientes.filter((item) => compactar(item.dni) === dni);
    if (coincidencias.length === 1) return { cliente: coincidencias[0] };
    if (coincidencias.length > 1) return { motivo: `Hay más de un cliente con DNI ${dni}.` };
  }

  const telefono = telefonoComparable(fila.telefono || "");
  const nombre = clave(fila.nombre || "");
  if (telefono && nombre) {
    const coincidencias = clientes.filter(
      (item) =>
        telefonoComparable(item.telefono || "") === telefono && clave(item.nombre || "") === nombre
    );
    if (coincidencias.length === 1) return { cliente: coincidencias[0] };
    if (coincidencias.length > 1) {
      return { motivo: "Hay más de un cliente con el mismo nombre y teléfono." };
    }
  }

  return {
    motivo: "No se pudo identificar el cliente. Volvé a exportar el archivo para que incluya la columna ID.",
  };
};

export async function leerResumenClientesExcel(
  file: File,
  clientes: ClienteImportable[],
  catalogos: CatalogosImportacion
): Promise<ResumenImportacion> {
  const { filas, columnas } = filasDesdeMatriz(await matrizDesdeArchivo(file));
  return analizarFilas(filas, columnas, clientes, catalogos);
}

export function analizarFilas(
  filas: FilaExcel[],
  columnas: Set<Campo>,
  clientes: ClienteImportable[],
  catalogos: CatalogosImportacion
): ResumenImportacion {
  const actualizaciones: ActualizacionCliente[] = [];
  const observaciones: FilaObservada[] = [];
  const idsVistos = new Set<number>();
  const dniTomados = new Map<string, number>();
  let sinCambios = 0;

  clientes.forEach((cliente) => {
    const dni = clave(cliente.dni || "");
    if (dni) dniTomados.set(dni, cliente.id);
  });

  filas.forEach((fila) => {
    const nombreVisible = compactar(fila.nombre) || "Sin nombre";
    const encontrado = buscarCliente(fila, columnas, clientes);
    if ("motivo" in encontrado) {
      observaciones.push({ fila: fila.fila, nombre: nombreVisible, motivo: encontrado.motivo });
      return;
    }

    const cliente = encontrado.cliente;
    if (idsVistos.has(cliente.id)) {
      observaciones.push({
        fila: fila.fila,
        nombre: nombreVisible,
        motivo: "Este cliente ya aparece en otra fila del archivo.",
      });
      return;
    }
    idsVistos.add(cliente.id);

    if (!compactar(fila.nombre)) {
      observaciones.push({
        fila: fila.fila,
        nombre: cliente.nombre || nombreVisible,
        motivo: "El nombre no puede quedar vacío.",
      });
      return;
    }

    const zonaActualNumero =
      cliente.zona == null || cliente.zona === "" ? null : parseInt(String(cliente.zona), 10);
    const zonaActualId =
      zonaActualNumero != null && !Number.isNaN(zonaActualNumero) ? zonaActualNumero : null;
    let zonaId = zonaActualId;
    if (columnas.has("zona")) {
      const zonaResuelta = resolverZonaId(fila.zona || "", catalogos.zonas);
      if (zonaResuelta === "invalida") {
        observaciones.push({
          fila: fila.fila,
          nombre: nombreVisible,
          motivo: `Zona desconocida: "${compactar(fila.zona)}".`,
        });
        return;
      }
      if (zonaResuelta == null && zonaActualId != null) {
        observaciones.push({
          fila: fila.fila,
          nombre: nombreVisible,
          motivo: "No se puede dejar la zona vacía.",
        });
        return;
      }
      zonaId = zonaResuelta;
    }

    if (
      columnas.has("telefono") &&
      /e\+/i.test(compactar(fila.telefono))
    ) {
      observaciones.push({
        fila: fila.fila,
        nombre: nombreVisible,
        motivo: "El teléfono se guardó como número científico. Formateá esa columna como texto y volvé a importar.",
      });
      return;
    }

    const repartidor = resolverCatalogo(
      columnas.has("repartidor") ? fila.repartidor || "" : cliente.repartidor || "",
      catalogos.repartidores,
      cliente.repartidor || "",
      []
    );
    if (repartidor == null) {
      observaciones.push({
        fila: fila.fila,
        nombre: nombreVisible,
        motivo: `Repartidor desconocido: "${compactar(fila.repartidor)}".`,
      });
      return;
    }

    const dia = resolverCatalogo(
      columnas.has("dia_reparto") ? fila.dia_reparto || "" : cliente.dia_reparto || "",
      catalogos.diasReparto,
      cliente.dia_reparto || "",
      ["no asignado", "sin asignar"]
    );
    if (dia == null) {
      observaciones.push({
        fila: fila.fila,
        nombre: nombreVisible,
        motivo: `Día de reparto desconocido: "${compactar(fila.dia_reparto)}".`,
      });
      return;
    }

    let estadoNuevo: boolean | undefined;
    if (columnas.has("estado") && compactar(fila.estado)) {
      const estado = parseEstado(fila.estado || "");
      if (estado == null) {
        observaciones.push({
          fila: fila.fila,
          nombre: nombreVisible,
          motivo: `Estado desconocido: "${compactar(fila.estado)}". Usá Activo o Inactivo.`,
        });
        return;
      }
      if (estado !== (cliente.estado !== false)) estadoNuevo = estado;
    }

    const dniNuevo = columnas.has("dni") ? compactar(fila.dni) : compactar(cliente.dni);
    const duenoDni = dniNuevo ? dniTomados.get(clave(dniNuevo)) : undefined;
    if (dniNuevo && duenoDni != null && duenoDni !== cliente.id) {
      observaciones.push({
        fila: fila.fila,
        nombre: nombreVisible,
        motivo: `El DNI ${dniNuevo} ya pertenece a otro cliente.`,
      });
      return;
    }

    const tieneColumnasDomicilio = columnas.has("piso") || columnas.has("departamento");
    let direccion = compactar(cliente.direccion);
    let piso = compactar(cliente.piso);
    let departamento = compactar(cliente.departamento);
    if (tieneColumnasDomicilio) {
      if (columnas.has("direccion")) direccion = compactar(fila.direccion);
      if (columnas.has("piso")) piso = compactar(fila.piso);
      if (columnas.has("departamento")) departamento = compactar(fila.departamento);
    } else if (columnas.has("direccion")) {
      const ingresada = compactar(fila.direccion);
      const legacy = direccionExportadaAnterior(cliente);
      if (ingresada !== compactar(cliente.direccion) && ingresada !== legacy) {
        direccion = ingresada;
      }
    }

    const cambios: CambioCampo[] = [];
    const agregar = (campo: string, anterior: unknown, nuevo: unknown) => {
      if (distinto(anterior, nuevo)) {
        cambios.push({
          campo,
          anterior: compactar(anterior) || "—",
          nuevo: compactar(nuevo) || "—",
        });
      }
    };

    agregar("Nombre", cliente.nombre, fila.nombre);
    if (columnas.has("telefono") && telefonoComparable(fila.telefono || "") !== telefonoComparable(cliente.telefono || "")) {
      agregar("Teléfono", cliente.telefono, fila.telefono);
    }
    if (columnas.has("email")) agregar("Email", cliente.email, fila.email);
    if (columnas.has("dni")) agregar("DNI", cliente.dni, dniNuevo);
    agregar("Dirección", cliente.direccion, direccion);
    agregar("Piso", cliente.piso, piso);
    agregar("Departamento", cliente.departamento, departamento);
    if (columnas.has("zona")) agregar("Zona", nombreZona(cliente.zona, catalogos.zonas), zonaId == null ? "" : catalogos.zonas[zonaId]?.nombre);
    if (columnas.has("repartidor")) agregar("Repartidor", cliente.repartidor, repartidor);
    if (columnas.has("dia_reparto")) agregar("Día de reparto", cliente.dia_reparto, dia);
    if (estadoNuevo !== undefined) {
      agregar("Estado", cliente.estado === false ? "Inactivo" : "Activo", estadoNuevo ? "Activo" : "Inactivo");
    }

    const avisos: string[] = [];
    const envasesComparables = (valor: string) => {
      const texto = clave(valor);
      if (!texto || texto === "sin envases" || texto === "sin envases prestados") return "";
      return compactar(valor);
    };
    if (
      columnas.has("envases") &&
      envasesComparables(fila.envases || "") !== envasesComparables(cliente.envasesTexto || "")
    ) {
      avisos.push("Los envases prestados no se actualizan desde el Excel.");
    }
    if (columnas.has("vinculado") && distinto(fila.vinculado, cliente.vinculadoTexto || "")) {
      avisos.push("El cliente vinculado no se actualiza desde el Excel.");
    }

    if (cambios.length === 0) {
      if (avisos.length > 0) {
        observaciones.push({
          fila: fila.fila,
          nombre: compactar(fila.nombre) || cliente.nombre || nombreVisible,
          motivo: avisos.join(" "),
        });
      } else {
        sinCambios += 1;
      }
      return;
    }

    if (dniNuevo) dniTomados.set(clave(dniNuevo), cliente.id);
    const dniAnterior = clave(cliente.dni || "");
    if (dniAnterior && dniAnterior !== clave(dniNuevo) && dniTomados.get(dniAnterior) === cliente.id) {
      dniTomados.delete(dniAnterior);
    }

    const direccionCambio = distinto(cliente.direccion, direccion);
    const telefono =
      columnas.has("telefono") &&
      telefonoComparable(fila.telefono || "") !== telefonoComparable(cliente.telefono || "")
        ? compactar(fila.telefono)
        : compactar(cliente.telefono);
    actualizaciones.push({
      fila: fila.fila,
      id: cliente.id,
      nombre: compactar(fila.nombre),
      cambios,
      aviso: avisos.join(" ") || undefined,
      estado: estadoNuevo,
      datos: {
        dni: dniNuevo,
        nombre: compactar(fila.nombre),
        email: columnas.has("email") ? compactar(fila.email) : compactar(cliente.email),
        telefono,
        direccion,
        piso: piso || null,
        departamento: departamento || null,
        zonaId,
        repartidor,
        dia_reparto: dia,
        latitud: direccionCambio ? null : cliente.latitud ?? null,
        longitud: direccionCambio ? null : cliente.longitud ?? null,
      },
    });
  });

  return {
    totalFilas: filas.length,
    actualizaciones,
    sinCambios,
    observaciones,
  };
}
