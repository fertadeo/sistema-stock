self.addEventListener('push', (event) => {
  let payload = { title: 'Sodería Don Javier', body: '', url: '/repartidor/ruta' };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // usar payload por defecto
  }

  const targetUrl = payload.url || '/repartidor/ruta';
  const fullUrl = targetUrl.startsWith('http')
    ? targetUrl
    : `${self.location.origin}${targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`}`;

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/images/soderialogo.png',
      badge: '/images/soderialogo.png',
      data: { url: fullUrl },
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || `${self.location.origin}/repartidor/ruta`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client && typeof client.navigate === 'function') {
              return client.navigate(url);
            }
            return undefined;
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })
  );
});
