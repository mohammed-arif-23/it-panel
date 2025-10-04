// Custom Service Worker for Push Notifications
console.log('Service Worker: Custom SW loaded');

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push event received', event);
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'notification',
    data: {
      url: '/dashboard'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Service Worker: Parsed push data', data);
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data,
        requireInteraction: false,
        vibrate: [200, 100, 200]
      };
    } catch (e) {
      console.error('Service Worker: Error parsing push data', e);
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/dashboard';

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              return client.navigate(urlToOpen);
            });
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Service Worker: Notification closed', event);
});

console.log('Service Worker: Push handlers registered');
