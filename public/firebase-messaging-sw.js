// Firebase Cloud Messaging Service Worker (for compatibility)
// This file handles push notifications

// Import the Workbox SW if it exists
try {
  importScripts('/sw.js');
} catch (e) {
  console.log('No Workbox SW to import');
}

console.log('Push SW: Loaded');

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('Push SW: Push event received', event);
  
  let payload = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'notification',
    data: {
      url: '/dashboard',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push SW: Parsed data', data);
      payload = {
        title: data.title || payload.title,
        body: data.body || payload.body,
        icon: data.icon || payload.icon,
        badge: data.badge || payload.badge,
        tag: data.tag || payload.tag,
        data: data.data || payload.data,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        actions: data.actions || []
      };
    } catch (e) {
      console.error('Push SW: Parse error', e);
      // Try text format
      try {
        payload.body = event.data.text();
      } catch (e2) {
        console.error('Push SW: Text parse error', e2);
      }
    }
  }

  const notificationPromise = self.registration.showNotification(
    payload.title,
    {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
      vibrate: payload.vibrate,
      actions: payload.actions
    }
  );

  event.waitUntil(notificationPromise);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Push SW: Notification clicked', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === fullUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Push SW: Notification closed', event.notification);
});

console.log('Push SW: All handlers registered');
