const SW_URL = '/sw.js';
const SW_SCOPE = '/';
const RELOAD_FLAG = 'pwa-sw-reload-once';
const RETRY_FLAG = 'pwa-sw-retry-once';
const ACTIVATION_TIMEOUT_MS = 90_000;

function conTimeout<T>(promise: Promise<T>, ms: number, mensaje: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(mensaje)), ms);
    }),
  ]);
}

export type DiagnosticoServiceWorker = {
  registraciones: number;
  activo: boolean;
  controlaPagina: boolean;
  estadoWorker?: ServiceWorkerState;
};

export async function obtenerDiagnosticoServiceWorker(): Promise<DiagnosticoServiceWorker> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { registraciones: 0, activo: false, controlaPagina: false };
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const registration = registrations.find((r) => r.active) ?? registrations[0];
  const worker = registration?.active ?? registration?.installing ?? registration?.waiting;

  return {
    registraciones: registrations.length,
    activo: Boolean(registration?.active),
    controlaPagina: Boolean(navigator.serviceWorker.controller),
    estadoWorker: worker?.state,
  };
}

function esperarWorkerActivo(
  worker: ServiceWorker,
  ms: number,
  onProgreso?: (mensaje: string) => void
): Promise<void> {
  if (worker.state === 'activated') {
    return Promise.resolve();
  }

  if (worker.state === 'installing') {
    onProgreso?.('Instalando actualización de la app (puede tardar 1 minuto con datos móviles)...');
  } else if (worker.state === 'waiting') {
    onProgreso?.('Activando service worker...');
  }

  return conTimeout(
    new Promise<void>((resolve, reject) => {
      const onState = () => {
        if (worker.state === 'installing') {
          onProgreso?.('Instalando actualización de la app (puede tardar 1 minuto con datos móviles)...');
        }
        if (worker.state === 'activated') {
          worker.removeEventListener('statechange', onState);
          resolve();
        } else if (worker.state === 'redundant') {
          worker.removeEventListener('statechange', onState);
          reject(new Error('Service worker inválido. Borrá datos del sitio en Chrome y reinstalá la app.'));
        }
      };
      worker.addEventListener('statechange', onState);
      onState();
    }),
    ms,
    'El service worker tardó demasiado. Usá WiFi, esperá 1 minuto y volvé a intentar. Si persiste, borrá datos del sitio en Chrome.'
  );
}

async function esperarActivacion(
  registration: ServiceWorkerRegistration,
  ms: number,
  onProgreso?: (mensaje: string) => void
): Promise<void> {
  if (registration.active) return;

  let worker = registration.installing ?? registration.waiting;
  if (worker) {
    await esperarWorkerActivo(worker, ms, onProgreso);
    return;
  }

  try {
    await registration.update();
  } catch {
    // continuar
  }

  worker = registration.installing ?? registration.waiting;
  if (worker) {
    await esperarWorkerActivo(worker, ms, onProgreso);
  }
}

async function limpiarRegistrosSinActivar(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((reg) => !reg.active)
      .map((reg) => reg.unregister().catch(() => undefined))
  );
}

export async function asegurarServiceWorkerRegistrado(
  onProgreso?: (mensaje: string) => void
): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service worker no disponible en este navegador');
  }

  const intentarRegistro = async (): Promise<ServiceWorkerRegistration> => {
    onProgreso?.('Registrando service worker...');

    const registrations = await navigator.serviceWorker.getRegistrations();
    let registration = registrations.find((r) => r.active) ?? registrations[0];

    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(
          `No se pudo registrar ${SW_URL}: ${msg}. Abrí la app desde el ícono instalado en Chrome.`
        );
      }
    }

    await esperarActivacion(registration, ACTIVATION_TIMEOUT_MS, onProgreso);

    if (!registration.active) {
      throw new Error(
        'Service worker inactivo. Recargá la página. Si persiste, borrá datos del sitio en Chrome y reinstalá la app.'
      );
    }

    return registration;
  };

  try {
    return await intentarRegistro();
  } catch (error) {
    if (sessionStorage.getItem(RETRY_FLAG)) {
      throw error;
    }
    sessionStorage.setItem(RETRY_FLAG, '1');
    onProgreso?.('Reintentando registro del service worker...');
    await limpiarRegistrosSinActivar();
    return intentarRegistro();
  }
}

export type PreparacionServiceWorker =
  | { recargando: true }
  | { recargando: false; registration: ServiceWorkerRegistration };

export async function prepararServiceWorkerParaPush(
  onProgreso?: (mensaje: string) => void
): Promise<PreparacionServiceWorker> {
  const registration = await asegurarServiceWorkerRegistrado(onProgreso);

  if (!navigator.serviceWorker.controller && registration.active) {
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      onProgreso?.('Recargando para activar notificaciones...');
      window.location.reload();
      return { recargando: true };
    }
  }

  if (!navigator.serviceWorker.controller) {
    onProgreso?.('Esperando control del service worker...');
    await conTimeout(
      new Promise<void>((resolve, reject) => {
        if (navigator.serviceWorker.controller) {
          resolve();
          return;
        }

        const onChange = () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.removeEventListener('controllerchange', onChange);
            resolve();
          }
        };

        navigator.serviceWorker.addEventListener('controllerchange', onChange);
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', onChange);
          if (navigator.serviceWorker.controller) {
            resolve();
          } else {
            reject(
              new Error(
                'La app no quedó lista para push. Cerrala por completo y abrila desde el ícono en la pantalla de inicio.'
              )
            );
          }
        }, 12_000);
      }),
      13_000,
      'La app no quedó lista para push. Cerrala por completo y abrila desde el ícono en la pantalla de inicio.'
    );
  }

  sessionStorage.removeItem(RETRY_FLAG);
  return { recargando: false, registration };
}
