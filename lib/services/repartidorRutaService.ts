import { authFetch, createApiUrl } from '@/lib/api/fetchWithAuth';
import { prepararServiceWorkerParaPush } from '@/lib/pwa/serviceWorker';

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

function conTimeout<T>(promise: Promise<T>, ms: number, mensaje: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(mensaje)), ms);
    }),
  ]);
}

async function sincronizarSuscripcionConServidor(
  subscription: PushSubscription
): Promise<boolean> {
  await conTimeout(
    repartidorRutaService.suscribirPush(subscription.toJSON() as PushSubscriptionJSON),
    15_000,
    'El servidor no respondió al guardar la suscripción. Verificá internet.'
  );
  const estado = await conTimeout(
    repartidorRutaService.obtenerEstadoPush(),
    10_000,
    'No se pudo verificar el estado push en el servidor.'
  );
  return estado.suscripcion_activa;
}

export async function activarPushNotifications(options?: {
  onProgreso?: (mensaje: string) => void;
}): Promise<{
  ok: boolean;
  razon?: string;
  suscrito?: boolean;
}> {
  const onProgreso = options?.onProgreso;
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, razon: 'Este dispositivo no soporta notificaciones' };
  }

  const permiso =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
  if (permiso !== 'granted') {
    return { ok: false, razon: 'Permiso de notificaciones denegado' };
  }

  const { publicKey, habilitado } = await conTimeout(
    repartidorRutaService.obtenerVapidPublicKey(),
    10_000,
    'El servidor no respondió al obtener la clave push.'
  );
  if (!habilitado || !publicKey) {
    return {
      ok: true,
      suscrito: false,
      razon: 'Permiso OK. Falta configurar VAPID en el servidor para alertas con la app cerrada.',
    };
  }

  let registration: ServiceWorkerRegistration;
  try {
    const preparacion = await prepararServiceWorkerParaPush(onProgreso);
    if (preparacion.recargando) {
      return {
        ok: true,
        suscrito: false,
        razon: 'Recargando para activar notificaciones push...',
      };
    }
    registration = preparacion.registration;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'No se pudo iniciar el service worker';
    return {
      ok: false,
      razon: `${msg}. Recargá la app o reinstalala desde Chrome.`,
    };
  }

  if (!registration.pushManager) {
    return {
      ok: false,
      razon: 'Push no disponible en este navegador. Usá Chrome en Android con la app instalada.',
    };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    try {
      const sincronizado = await sincronizarSuscripcionConServidor(subscription);
      if (sincronizado) {
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
    onProgreso?.('Conectando con Google Push...');
    subscription = await conTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }),
      30_000,
      'Google Push no respondió. Verificá internet, cerrá la app y abrila desde el ícono instalado.'
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al suscribir push';
    return {
      ok: false,
      razon: `No se pudo registrar el celular: ${msg}. Usá Chrome, instalá la app desde el menú y volvé a intentar.`,
    };
  }

  try {
    onProgreso?.('Guardando suscripción en el servidor...');
    const sincronizado = await sincronizarSuscripcionConServidor(subscription);
    if (!sincronizado) {
      return {
        ok: false,
        razon: 'El servidor no recibió la suscripción. Verificá conexión y volvé a intentar.',
      };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al guardar en el servidor';
    return {
      ok: false,
      razon: `Suscripción local OK pero falló en servidor: ${msg}`,
    };
  }

  return { ok: true, suscrito: true, razon: 'Celular registrado para alertas push' };
}

export async function asegurarSuscripcionPushSilenciosa(): Promise<{
  suscrito: boolean;
  razon?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
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

    if (Notification.permission !== 'granted') {
      return { suscrito: false, razon: 'Falta activar permisos en Ruta' };
    }

    const preparacion = await prepararServiceWorkerParaPush();
    if (preparacion.recargando) {
      return { suscrito: false, razon: 'Recargando para activar push...' };
    }
    const registration = preparacion.registration;
    const subscription = await registration.pushManager?.getSubscription();
    if (!subscription) {
      return {
        suscrito: false,
        razon: 'Tocá "Registrar este celular para alertas" (requiere un toque en el botón)',
      };
    }

    const sincronizado = await sincronizarSuscripcionConServidor(subscription);
    return {
      suscrito: sincronizado,
      razon: sincronizado ? undefined : 'No se pudo sincronizar con el servidor',
    };
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
