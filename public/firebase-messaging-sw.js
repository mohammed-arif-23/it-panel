// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDCZ078Hh3el3NOnZz86i9B6h4OZm8TzGI",
  authDomain: "dynamit-b2aac.firebaseapp.com",
  projectId: "dynamit-b2aac",
  storageBucket: "dynamit-b2aac.firebasestorage.app",
  messagingSenderId: "388888953459",
  appId: "1:388888953459:web:79a24146cc5730b3702006"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('FCM SW: Loaded');

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('FCM SW: Background message received', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'notification',
    data: {
      url: payload.data?.url || '/dashboard',
      priority: payload.data?.priority || 'medium',
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'View Details',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icon-192.png'
      }
    ],
    requireInteraction: payload.data?.priority === 'urgent',
    silent: payload.data?.priority === 'low'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Fallback push event listener
self.addEventListener('push', function(event) {
  console.log('FCM SW: Push event received', event);
  
  if (event.data) {
    const payload = event.data.json();
    console.log('FCM SW: Push payload:', payload);
    
    const title = payload.notification?.title || payload.data?.title || 'New Notification';
    const options = {
      body: payload.notification?.body || payload.data?.body || 'You have a new notification',
      icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.data?.tag || 'notification',
      data: payload.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
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
