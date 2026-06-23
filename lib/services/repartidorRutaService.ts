import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RutaParadaCliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  piso?: string | null;
  departamento?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface RutaParada {
  id: number;
  user_id: number;
  cliente_id: number;
  comentario: string | null;
  hora_alerta: string | null;
  fecha: string;
  alerta_enviada: boolean;
  visitado: boolean;
  orden: number;
  creado_at: string;
  cliente: RutaParadaCliente | null;
}

export interface CrearParadaPayload {
  cliente_id: number;
  comentario?: string;
  hora_alerta?: string;
  fecha?: string;
}

export interface ActualizarParadaPayload {
  comentario?: string | null;
  hora_alerta?: string | null;
  visitado?: boolean;
  orden?: number;
}

class RepartidorRutaService {
  private buildApiUrl(path: string): string {
    return createApiUrl(path);
  }

  async listarParadas(fecha?: string): Promise<RutaParada[]> {
    const params = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    const response = await authFetch(this.buildApiUrl(`/api/repartidor-ruta/paradas${params}`));
    const json: ApiEnvelope<RutaParada[]> = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudieron cargar las paradas');
    }
    return json.data;
  }

  async crearParada(payload: CrearParadaPayload): Promise<RutaParada> {
    const response = await authFetch(this.buildApiUrl('/api/repartidor-ruta/paradas'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json: ApiEnvelope<RutaParada> = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudo agregar el cliente a la ruta');
    }
    return json.data;
  }

  async actualizarParada(id: number, payload: ActualizarParadaPayload): Promise<RutaParada> {
    const response = await authFetch(this.buildApiUrl(`/api/repartidor-ruta/paradas/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const json: ApiEnvelope<RutaParada> = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudo actualizar la parada');
    }
    return json.data;
  }

  async eliminarParada(id: number): Promise<void> {
    const response = await authFetch(this.buildApiUrl(`/api/repartidor-ruta/paradas/${id}`), {
      method: 'DELETE',
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudo eliminar la parada');
    }
  }

  async marcarAlertaEnviada(id: number): Promise<void> {
    await authFetch(this.buildApiUrl(`/api/repartidor-ruta/paradas/${id}/alerta-enviada`), {
      method: 'POST',
    });
  }

  async obtenerVapidPublicKey(): Promise<{ publicKey: string | null; habilitado: boolean }> {
    const response = await authFetch(this.buildApiUrl('/api/repartidor-ruta/push/vapid-public-key'));
    const json: ApiEnvelope<{ publicKey: string | null; habilitado: boolean }> = await response.json();
    if (!response.ok || !json.success) {
      return { publicKey: null, habilitado: false };
    }
    return json.data;
  }

  async suscribirPush(subscription: PushSubscriptionJSON): Promise<void> {
    const response = await authFetch(this.buildApiUrl('/api/repartidor-ruta/push/subscribe'), {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudo activar las alertas push');
    }
  }

  async desuscribirPush(endpoint: string): Promise<void> {
    await authFetch(this.buildApiUrl('/api/repartidor-ruta/push/unsubscribe'), {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }
}

export const repartidorRutaService = new RepartidorRutaService();

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function activarPushNotifications(): Promise<{
  ok: boolean;
  razon?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, razon: 'Este dispositivo no soporta notificaciones' };
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    return { ok: false, razon: 'Permiso de notificaciones denegado' };
  }

  const { publicKey, habilitado } = await repartidorRutaService.obtenerVapidPublicKey();
  if (!habilitado || !publicKey) {
    return { ok: true, razon: 'Alertas locales activadas (push del servidor no configurado)' };
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await repartidorRutaService.suscribirPush(subscription.toJSON() as PushSubscriptionJSON);
  return { ok: true };
}

export function mostrarNotificacionLocal(
  titulo: string,
  opciones?: NotificationOptions & { url?: string }
) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const { url, ...rest } = opciones || {};

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((registration) => {
      void registration.showNotification(titulo, {
        icon: '/images/soderialogo.png',
        badge: '/images/soderialogo.png',
        ...rest,
        data: { url: url || '/repartidor/ruta' },
      });
    });
    return;
  }

  new Notification(titulo, {
    icon: '/images/soderialogo.png',
    ...rest,
  });
}
