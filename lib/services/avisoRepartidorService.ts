import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';

export type AvisoRepartidor = {
  id: number;
  repartidor_id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  monto: number | null;
  cliente_id: number | null;
  cobro_id: number | null;
  cobrado_por_repartidor_id: number | null;
  leido: boolean;
  creado_at: string;
};

class AvisoRepartidorClient {
  async listar(): Promise<{ avisos: AvisoRepartidor[]; no_leidos: number }> {
    const response = await authFetch(createApiUrl('/api/avisos-repartidor'));
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudieron cargar los avisos');
    }
    return json.data;
  }

  async marcarLeido(id: number): Promise<void> {
    await authFetch(createApiUrl(`/api/avisos-repartidor/${id}/leido`), {
      method: 'PATCH',
    });
  }

  async marcarTodosLeidos(): Promise<void> {
    await authFetch(createApiUrl('/api/avisos-repartidor/leer-todos'), {
      method: 'POST',
    });
  }
}

export const avisoRepartidorService = new AvisoRepartidorClient();
