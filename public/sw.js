// Service Worker for Push Notifications
// Handles background push messages and notification interactions

const CACHE_NAME = 'unified-college-app-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/badge-72x72.png',
  '/offline.html'
];

// Minimal service worker to prevent 404 errors
// This file exists to handle browser requests for service worker
// No PWA functionality is implemented

self.addEventListener('install', function(event) {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
});

// No caching or offline functionality implemented
// This is just a placeholder to prevent 404 errors

// Push event - handle incoming push messages
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let notificationData = {
    title: 'College App',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    data: {},
    actions: [],
    requireInteraction: false,
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Determine notification options based on type
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: notificationData.requireInteraction,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  // Add custom actions based on notification type
  if (notificationData.data.type === 'assignment') {
    options.actions = [
      { action: 'view', title: 'View Assignment', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ];
  } else if (notificationData.data.type === 'seminar') {
    if (notificationData.data.action === 'booking-open') {
      options.actions = [
        { action: 'book', title: 'Book Now', icon: '/icons/book.png' },
        { action: 'remind', title: 'Remind Later', icon: '/icons/remind.png' }
      ];
    } else if (notificationData.data.action === 'reminder') {
      options.actions = [
        { action: 'acknowledge', title: 'I\'m Ready', icon: '/icons/check.png' },
        { action: 'calendar', title: 'Add to Calendar', icon: '/icons/calendar.png' }
      ];
    }
  } else if (notificationData.data.type === 'fine') {
    options.actions = [
      { action: 'pay', title: 'Pay Fine', icon: '/icons/payment.png' },
      { action: 'details', title: 'View Details', icon: '/icons/details.png' }
    ];
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close notification
  notification.close();

  // Handle different actions
  event.waitUntil(
    handleNotificationAction(action, data)
  );
});

// Handle notification actions
async function handleNotificationAction(action, data) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  // Try to focus existing window or open new one
  let targetUrl = '/';
  
  // Determine target URL based on notification type and action
  if (data.type === 'assignment') {
    if (action === 'view' || action === 'submit') {
      targetUrl = '/assignments';
    }
  } else if (data.type === 'seminar') {
    if (action === 'book') {
      targetUrl = '/seminars';
    } else if (action === 'acknowledge' || action === 'calendar') {
      targetUrl = '/seminars/my-selections';
    }
  } else if (data.type === 'fine') {
    if (action === 'pay' || action === 'details') {
      targetUrl = '/fines';
    }
  } else if (data.type === 'nptel') {
    targetUrl = '/nptel';
  } else if (data.type === 'profile') {
    targetUrl = '/profile';
  }

  // Special actions
  if (action === 'dismiss' || action === 'later') {
    // Just close notification, no navigation needed
    return;
  }

  if (action === 'snooze') {
    // Schedule reminder for later (this would need backend support)
    console.log('Snooze requested for:', data);
    return;
  }

  if (action === 'calendar' && data.date) {
    // Generate calendar event
    const eventData = {
      title: data.topic || 'Seminar',
      start: new Date(data.date),
      description: `Seminar: ${data.topic || 'College Seminar'}`
    };
    
    // Create calendar URL (Google Calendar)
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${eventData.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${eventData.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(eventData.description)}`;
    
    await self.clients.openWindow(calendarUrl);
    return;
  }

  // Navigate to target URL
  let targetClient = null;

  // Check if there's already a window open with the app
  for (const client of clients) {
    if (client.url.includes(self.location.origin)) {
      targetClient = client;
      break;
    }
  }

  if (targetClient) {
    // Focus existing window and navigate
    await targetClient.focus();
    targetClient.postMessage({
      type: 'NAVIGATE',
      url: targetUrl,
      data: data
    });
  } else {
    // Open new window
    await self.clients.openWindow(targetUrl);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync pending actions when online
    console.log('Performing background sync...');
    
    // This could include:
    // - Sending queued submissions
    // - Updating cached data
    // - Syncing notification preferences
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Fetch event - handle offline functionality
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for offline support
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached offline page if network fails
          return caches.match('/offline.html');
        })
    );
  }
});

// Message event - handle communication from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});