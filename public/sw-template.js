// Custom Service Worker Template with Push Support
// This will be the base for the generated service worker

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
  let notificationData = {
    title: 'IT Panel Notification',
    body: 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'notification',
    data: { url: '/dashboard' },
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: payload.data || notificationData.data,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200]
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Try as text
      try {
        notificationData.body = event.data.text();
      } catch (e2) {
        console.error('[SW] Error parsing push text:', e2);
      }
    }
  }

  // Show notification
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
      console.log('[SW] ✅ Notification displayed successfully');
    }).catch((error) => {
      console.error('[SW] ❌ Error displaying notification:', error);
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            return client.focus().then(() => client.navigate(fullUrl));
          }
        }
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
});

console.log('[SW] Push notification handlers registered ✅');
