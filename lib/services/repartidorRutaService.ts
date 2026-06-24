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

  async obtenerEstadoPush(): Promise<{ vapid_configurado: boolean; suscripcion_activa: boolean }> {
    const response = await authFetch(this.buildApiUrl('/api/repartidor-ruta/push/estado'));
    const json: ApiEnvelope<{ vapid_configurado: boolean; suscripcion_activa: boolean }> =
      await response.json();
    if (!response.ok || !json.success) {
      return { vapid_configurado: false, suscripcion_activa: false };
    }
    return json.data;
  }

  async enviarPushPrueba(): Promise<void> {
    const response = await authFetch(this.buildApiUrl('/api/repartidor-ruta/push/test'), {
      method: 'POST',
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'No se pudo enviar la notificación de prueba');
    }
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
  suscrito?: boolean;
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
    return {
      ok: true,
      suscrito: false,
      razon: 'Permiso OK. Falta configurar VAPID en el servidor para alertas con la app cerrada.',
    };
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  // Sincronizar suscripción existente con el servidor
  if (subscription) {
    try {
      await repartidorRutaService.suscribirPush(subscription.toJSON() as PushSubscriptionJSON);
      const estado = await repartidorRutaService.obtenerEstadoPush();
      if (estado.suscripcion_activa) {
        return { ok: true, suscrito: true, razon: 'Dispositivo registrado para alertas push' };
      }
    } catch {
      // La suscripción del navegador puede ser inválida (ej. VAPID cambió)
    }
    try {
      await subscription.unsubscribe();
    } catch {
      // continuar con nueva suscripción
    }
    subscription = null;
  }

  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al suscribir push';
    return {
      ok: false,
      razon: `No se pudo registrar el celular: ${msg}. Usá Chrome e instalá la app desde el menú.`,
    };
  }

  await repartidorRutaService.suscribirPush(subscription.toJSON() as PushSubscriptionJSON);

  const estado = await repartidorRutaService.obtenerEstadoPush();
  if (!estado.suscripcion_activa) {
    return {
      ok: false,
      razon: 'El servidor no recibió la suscripción. Reintentá o recargá la app.',
    };
  }

  return { ok: true, suscrito: true, razon: 'Celular registrado para alertas push' };
}

export async function asegurarSuscripcionPushSilenciosa(): Promise<{
  suscrito: boolean;
  razon?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { suscrito: false, razon: 'Sin soporte de notificaciones' };
  }

  if (Notification.permission === 'denied') {
    return { suscrito: false, razon: 'Permiso denegado' };
  }

  try {
    const estado = await repartidorRutaService.obtenerEstadoPush();
    if (estado.suscripcion_activa) {
      return { suscrito: true };
    }

    if (Notification.permission === 'granted') {
      const resultado = await activarPushNotifications();
      return { suscrito: Boolean(resultado.suscrito), razon: resultado.razon };
    }

    return { suscrito: false, razon: 'Falta activar permisos en Ruta' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error de suscripción';
    return { suscrito: false, razon: msg };
  }
}

export async function mostrarNotificacionLocal(
  titulo: string,
  opciones?: NotificationOptions & { url?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return false;

  const { url, ...rest } = opciones || {};
  const notificationData = { url: url || '/repartidor/ruta' };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(titulo, {
        icon: '/images/soderialogo.png',
        badge: '/images/soderialogo.png',
        ...rest,
        data: notificationData,
      });
      return true;
    }

    new Notification(titulo, {
      icon: '/images/soderialogo.png',
      ...rest,
      data: notificationData,
    });
    return true;
  } catch {
    return false;
  }
}
