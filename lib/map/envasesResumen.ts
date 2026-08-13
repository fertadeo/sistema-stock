export type EnvasePrestadoItem = {
  producto_id?: number;
  producto_nombre?: string;
  /** Alias usado en algunos responses del listado de clientes. */
  nombre_producto?: string;
  capacidad?: number | null;
  cantidad: number;
};

export type CategoriaEnvase = 'agua' | 'soda' | 'otro';

export type ResumenProductoEnvase = {
  key: string;
  producto_id: number | null;
  producto_nombre: string;
  categoria: CategoriaEnvase;
  cantidad: number;
};

export type ResumenEnvasesFiltro = {
  totalUnidades: number;
  clientesConEnvases: number;
  porProducto: ResumenProductoEnvase[];
  agua: number;
  soda: number;
  otros: number;
};

export function categorizarProductoEnvase(nombre?: string | null): CategoriaEnvase {
  const n = (nombre || '').toLowerCase();
  if (/soda|sif[oó]n/.test(n)) return 'soda';
  if (/bid[oó]n|agua|20\s*l|dispenser/.test(n)) return 'agua';
  return 'otro';
}

export function resumirEnvasesClientes<
  T extends { id: number; envases_prestados?: EnvasePrestadoItem[] | null },
>(clientes: T[]): ResumenEnvasesFiltro {
  const porProducto = new Map<string, ResumenProductoEnvase>();
  let totalUnidades = 0;
  let clientesConEnvases = 0;
  let agua = 0;
  let soda = 0;
  let otros = 0;

  for (const cliente of clientes) {
    const envases = Array.isArray(cliente.envases_prestados)
      ? cliente.envases_prestados
      : [];
    let clienteTiene = false;

    for (const envase of envases) {
      const cantidad = Number(envase.cantidad) || 0;
      if (cantidad <= 0) continue;
      clienteTiene = true;
      totalUnidades += cantidad;

      const nombre =
        (typeof envase.producto_nombre === 'string' && envase.producto_nombre.trim()) ||
        (typeof envase.nombre_producto === 'string' && envase.nombre_producto.trim()) ||
        'Producto';
      const productoId =
        envase.producto_id != null && Number.isFinite(Number(envase.producto_id))
          ? Number(envase.producto_id)
          : null;
      const key = productoId != null ? `id:${productoId}` : `nombre:${nombre.toLowerCase()}`;
      const categoria = categorizarProductoEnvase(nombre);

      if (categoria === 'agua') agua += cantidad;
      else if (categoria === 'soda') soda += cantidad;
      else otros += cantidad;

      const prev = porProducto.get(key);
      if (prev) {
        prev.cantidad += cantidad;
      } else {
        porProducto.set(key, {
          key,
          producto_id: productoId,
          producto_nombre: nombre,
          categoria,
          cantidad,
        });
      }
    }

    if (clienteTiene) clientesConEnvases += 1;
  }

  return {
    totalUnidades,
    clientesConEnvases,
    porProducto: Array.from(porProducto.values()).sort((a, b) => b.cantidad - a.cantidad),
    agua,
    soda,
    otros,
  };
}

export function etiquetaFiltroEnvases(filtros: {
  dia?: string;
  repartidor?: string;
  zona?: string;
}): string {
  const partes: string[] = [];
  if (filtros.repartidor && filtros.repartidor !== 'todos' && filtros.repartidor.trim()) {
    partes.push(`Repartidor: ${filtros.repartidor}`);
  }
  if (filtros.dia && filtros.dia !== 'todos' && filtros.dia.trim()) {
    partes.push(`Día: ${filtros.dia}`);
  }
  if (filtros.zona && filtros.zona !== 'todos' && filtros.zona.trim()) {
    // En clientes el filtro de zona suele ser el id numérico
    partes.push(`Zona: ${filtros.zona}`);
  }
  return partes.length > 0 ? partes.join(' · ') : 'Todos los clientes (sin filtro)';
}
