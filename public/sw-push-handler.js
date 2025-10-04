// Push Notification Handler Extension
// This file adds push event handlers to the service worker

console.log('[Push Handler] Loading push notification handlers...');

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('[Push Handler] 🔔 Push event received:', event);
  
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
      console.log('[Push Handler] 📦 Parsed payload:', payload);
      
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
      console.error('[Push Handler] ❌ Error parsing JSON:', e);
      try {
        notificationData.body = event.data.text();
        console.log('[Push Handler] Using text payload:', notificationData.body);
      } catch (e2) {
        console.error('[Push Handler] ❌ Error parsing text:', e2);
      }
    }
  } else {
    console.log('[Push Handler] ⚠️ No push data received');
  }

  // Show notification
  const notificationPromise = self.registration.showNotification(
    notificationData.title, 
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate
    }
  ).then(() => {
    console.log('[Push Handler] ✅ Notification displayed successfully');
  }).catch((error) => {
    console.error('[Push Handler] ❌ Error displaying notification:', error);
  });

  event.waitUntil(notificationPromise);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Push Handler] 👆 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;
  
  console.log('[Push Handler] Opening URL:', fullUrl);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        console.log('[Push Handler] Found', clientList.length, 'client(s)');
        
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            console.log('[Push Handler] Focusing existing window');
            return client.focus().then(() => {
              return client.navigate(fullUrl);
            });
          }
        }
        
        // No window open, open a new one
        if (clients.openWindow) {
          console.log('[Push Handler] Opening new window');
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[Push Handler] 🚫 Notification closed:', event.notification.tag);
});

console.log('[Push Handler] ✅ All push handlers registered successfully');
