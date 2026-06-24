const SW_URL = '/sw.js';
const SW_SCOPE = '/';
const RELOAD_FLAG = 'pwa-sw-reload-once';

function conTimeout<T>(promise: Promise<T>, ms: number, mensaje: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(mensaje)), ms);
    }),
  ]);
}

function esperarWorkerActivo(worker: ServiceWorker, ms: number): Promise<void> {
  if (worker.state === 'activated') {
    return Promise.resolve();
  }

  return conTimeout(
    new Promise<void>((resolve, reject) => {
      const onState = () => {
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
    'El service worker tardó demasiado en activarse. Recargá la página e intentá de nuevo.'
  );
}

async function esperarActivacion(registration: ServiceWorkerRegistration, ms: number): Promise<void> {
  if (registration.active) return;

  let worker = registration.installing ?? registration.waiting;
  if (worker) {
    await esperarWorkerActivo(worker, ms);
    return;
  }

  try {
    await registration.update();
  } catch {
    // continuar
  }

  worker = registration.installing ?? registration.waiting ?? registration.active;
  if (worker instanceof ServiceWorker) {
    await esperarWorkerActivo(worker, ms);
  }
}

export async function asegurarServiceWorkerRegistrado(): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service worker no disponible en este navegador');
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  let registration = registrations.find((r) => r.active) ?? registrations[0];

  if (!registration) {
    try {
      registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `No se pudo cargar ${SW_URL}: ${msg}. Verificá que abriste la app instalada desde Chrome.`
      );
    }
  }

  await esperarActivacion(registration, 25_000);

  if (!registration.active) {
    throw new Error(
      'Service worker inactivo. Recargá la página. Si persiste, borrá datos del sitio en Chrome y reinstalá la app.'
    );
  }

  return registration;
}

export type PreparacionServiceWorker =
  | { recargando: true }
  | { recargando: false; registration: ServiceWorkerRegistration };

export async function prepararServiceWorkerParaPush(): Promise<PreparacionServiceWorker> {
  const registration = await asegurarServiceWorkerRegistrado();

  if (!navigator.serviceWorker.controller && registration.active) {
    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
      return { recargando: true };
    }
  }

  if (!navigator.serviceWorker.controller) {
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
        }, 8_000);
      }),
      9_000,
      'La app no quedó lista para push. Cerrala por completo y abrila desde el ícono en la pantalla de inicio.'
    );
  }

  return { recargando: false, registration };
}
