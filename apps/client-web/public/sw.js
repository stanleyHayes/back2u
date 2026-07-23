// Web push service worker. Receives notifications and displays them.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch { payload = { title: 'Back2u', body: event.data.text() }; }
  const { title = 'Back2u', body = '', data = {} } = payload;
  event.waitUntil(self.registration.showNotification(title, { body, data, icon: '/favicon.svg' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});
