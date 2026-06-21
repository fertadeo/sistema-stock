import { coincideRepartidor } from './repartidorMarkers';

export interface FiltrosCliente {
  dia?: string;
  repartidor?: string;
  zona?: string;
  busqueda?: string;
}

export interface ClienteFiltrable {
  nombre?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  zona?: string | number | null;
  repartidor?: string | null;
  dia_reparto?: string | null;
}

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string') return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractDiaSemana(diaReparto: string): string {
  return normalizeText(diaReparto).split('-')[0]?.trim() ?? '';
}

export function coincideDiaReparto(
  clienteDia: string | null | undefined,
  filtroDia: string | undefined
): boolean {
  if (!filtroDia || filtroDia === 'todos') return true;

  const cliente = normalizeText(clienteDia ?? '');
  const filtro = normalizeText(filtroDia);
  if (!cliente) return false;

  if (cliente === filtro) return true;

  const filtroTieneTurno = filtro.includes('-');
  const clienteTieneTurno = cliente.includes('-');

  if (filtroTieneTurno && clienteTieneTurno) {
    return false;
  }

  if (filtroTieneTurno || clienteTieneTurno) {
    return extractDiaSemana(clienteDia ?? '') === extractDiaSemana(filtroDia);
  }

  return cliente.includes(filtro) || filtro.includes(cliente);
}

export function coincideZona(
  clienteZona: string | number | null | undefined,
  filtroZona: string | undefined
): boolean {
  if (!filtroZona || filtroZona === 'todos') return true;
  const zonaCliente = normalizeText(clienteZona);
  if (!zonaCliente) return false;
  return zonaCliente === normalizeText(filtroZona);
}

export function coincideBusqueda(cliente: ClienteFiltrable, busqueda: string | undefined): boolean {
  if (!busqueda?.trim()) return true;
  const term = normalizeText(busqueda);
  const campos = [cliente.nombre, cliente.direccion, cliente.telefono, cliente.zona, cliente.repartidor];
  return campos.some((campo) => normalizeText(campo).includes(term));
}

export function clienteCoincideFiltros(
  cliente: ClienteFiltrable,
  filtros: FiltrosCliente
): boolean {
  return (
    coincideDiaReparto(cliente.dia_reparto, filtros.dia) &&
    coincideRepartidor(cliente.repartidor, filtros.repartidor ?? 'todos') &&
    coincideZona(cliente.zona, filtros.zona) &&
    coincideBusqueda(cliente, filtros.busqueda)
  );
}

export function filtrarClientes<T extends ClienteFiltrable>(
  clientes: T[],
  filtros: FiltrosCliente
): T[] {
  return clientes.filter((cliente) => clienteCoincideFiltros(cliente, filtros));
}

export function hayFiltrosActivos(filtros: FiltrosCliente): boolean {
  return (
    Boolean(filtros.dia && filtros.dia !== 'todos') ||
    Boolean(filtros.repartidor && filtros.repartidor !== 'todos') ||
    Boolean(filtros.zona && filtros.zona !== 'todos') ||
    Boolean(filtros.busqueda?.trim())
  );
}

export function clienteIncluidoEnRuta(
  cliente: ClienteFiltrable & { id: number },
  filtros: FiltrosCliente,
  clientesIncluidos: number[]
): boolean {
  return clientesIncluidos.includes(cliente.id) || clienteCoincideFiltros(cliente, filtros);
}
