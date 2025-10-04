// Dedicated Push Notification Service Worker
// This handles ONLY push notifications

self.addEventListener('push', function(event) {
  console.log('[Push SW] Push received:', event);
  
  let notificationData = {
    title: 'IT Panel Notification',
    body: 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Push SW] Payload:', payload);
      
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: payload.data || notificationData.data,
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
    } catch (e) {
      console.error('[Push SW] JSON parse error:', e);
      try {
        notificationData.body = event.data.text();
      } catch (e2) {
        console.error('[Push SW] Text parse error:', e2);
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate
    }).then(() => {
      console.log('[Push SW] Notification shown successfully');
    }).catch((error) => {
      console.error('[Push SW] Error showing notification:', error);
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Push SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => client.navigate(url));
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Push SW] Notification closed');
});

console.log('[Push SW] Push handlers registered');
