// Un único worker: carga Workbox (caché/offline) y suma las notificaciones push.
// No registrar /sw.js y este archivo por separado: ambos comparten el scope '/'.
importScripts('/sw.js');

// Service Worker customizado para manejar push notifications
// Este SW se registra DESPUÉS del SW de workbox para agregar funcionalidad de push

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (!event.data) {
    console.log('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push notification data:', data);

    const options = {
      body: data.body || 'Nueva notificación',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      image: data.image || undefined,
      tag: data.tag || 'notification',
      data: data.data || {},
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Abrir'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notificación', options)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
    // Si no es JSON, mostrar como texto plano
    event.waitUntil(
      self.registration.showNotification('IAM Paraná', {
        body: event.data.text() || 'Nueva notificación',
        icon: '/icon-192x192.png'
      })
    );
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data.url ? new URL(data.url, self.location.origin).href : '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Buscar si ya hay una ventana con la URL
      for (const client of clientList) {
        if (client.url === urlToOpen) {
          return client.focus();
        }
      }
      // Si no hay, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Manejar acciones de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed');
});
