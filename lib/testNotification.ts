/**
 * Test notification utility - call this from browser console to test
 */

export async function checkServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service Worker not supported in this browser');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`📋 Found ${registrations.length} service worker registration(s)`);
    
    registrations.forEach((reg, index) => {
      console.log(`\n🔹 Registration ${index + 1}:`, {
        scope: reg.scope,
        active: reg.active?.scriptURL,
        waiting: reg.waiting?.scriptURL,
        installing: reg.installing?.scriptURL,
      });
    });

    if (registrations.length === 0) {
      console.log('\n⚠️ No service workers registered!');
      console.log('This is why testSWNotification() and testPushSubscription() hang.');
      console.log('\nPossible causes:');
      console.log('1. PWA disabled in config');
      console.log('2. Service worker failed to register');
      console.log('3. Running on HTTP instead of HTTPS (except localhost)');
    }

    // Check controller
    if (navigator.serviceWorker.controller) {
      console.log('\n✅ Active controller:', navigator.serviceWorker.controller.scriptURL);
    } else {
      console.log('\n⚠️ No active service worker controller');
      console.log('Try refreshing the page after service worker registers');
    }
  } catch (error) {
    console.error('❌ Error checking service workers:', error);
  }
}

export async function testBrowserNotification() {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification from the browser',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test',
      requireInteraction: false
    });

    notification.onclick = function() {
      window.focus();
      this.close();
    };

    console.log('✅ Browser notification sent');
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Permission granted, try again');
    }
  } else {
    console.error('❌ Notifications are blocked');
  }
}

export async function testServiceWorkerNotification() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported');
    return;
  }

  // Check notification permission
  if (Notification.permission === 'denied') {
    console.error('❌ Notifications are blocked. Please enable them in browser settings.');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('⏳ Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('❌ Notification permission denied');
      return;
    }
    console.log('✅ Permission granted');
  }

  try {
    console.log('⏳ Waiting for service worker to be ready...');
    
    // Add timeout to prevent infinite waiting
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service Worker timeout - not ready after 5s')), 5000)
      )
    ]) as ServiceWorkerRegistration;
    
    console.log('✅ SW Registration ready:', registration);

    await registration.showNotification('SW Test Notification', {
      body: 'This is a test notification from Service Worker',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'sw-test',
      data: { url: '/dashboard' },
      requireInteraction: false
    });

    console.log('✅ SW notification sent - Check your system tray!');
  } catch (error) {
    console.error('❌ SW notification error:', error);
  }
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications not supported');
    return null;
  }

  try {
    // Check permission
    if (Notification.permission === 'denied') {
      console.error('❌ Notifications are blocked. Please enable them in browser settings.');
      return null;
    }

    // Request permission if needed
    if (Notification.permission !== 'granted') {
      console.log('⏳ Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('❌ Notification permission denied');
        return null;
      }
      console.log('✅ Permission granted');
    }

    console.log('⏳ Subscribing to push notifications...');
    
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
      )
    ]) as ServiceWorkerRegistration;
    
    console.log('✅ SW ready:', registration);

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('✅ Already subscribed:', subscription.endpoint);
      return subscription;
    }

    // Get VAPID public key from env or window
    let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    // Fallback to window object (can be set by API or config)
    if (!vapidPublicKey && typeof window !== 'undefined') {
      vapidPublicKey = (window as any).VAPID_PUBLIC_KEY;
    }
    
    console.log('🔑 VAPID key available:', !!vapidPublicKey);
    
    if (!vapidPublicKey) {
      console.error('❌ VAPID public key not found');
      console.log('Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env or run: window.VAPID_PUBLIC_KEY = "your-key"');
      return null;
    }
    
    console.log('🔑 Using VAPID key (first 20 chars):', vapidPublicKey.substring(0, 20) + '...');

    // Convert VAPID key
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as BufferSource
    });

    console.log('✅ Subscribed to push:', subscription.endpoint);

    // Get user ID from localStorage
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('⚠️ No user_id in localStorage. Subscription created but not saved to backend.');
      return subscription;
    }

    // Save to backend
    console.log('⏳ Saving subscription to backend...');
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId
      })
    });

    if (response.ok) {
      console.log('✅ Subscription saved to database!');
      console.log('✅ You can now receive push notifications from admin panel!');
    } else {
      console.error('❌ Failed to save subscription:', await response.text());
    }

    return subscription;
  } catch (error) {
    console.error('❌ Error subscribing to push:', error);
    return null;
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function testPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications not supported');
    return;
  }

  try {
    console.log('⏳ Waiting for service worker to be ready...');
    
    // Add timeout to prevent infinite waiting
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service Worker timeout - not ready after 5s')), 5000)
      )
    ]) as ServiceWorkerRegistration;
    
    console.log('✅ SW Registration ready:', registration);
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ Push subscription active:', {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys
      });
      return subscription;
    } else {
      console.log('⚠️ No push subscription found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking push subscription:', error);
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).checkSWStatus = checkServiceWorkerStatus;
  (window as any).testNotification = testBrowserNotification;
  (window as any).testSWNotification = testServiceWorkerNotification;
  (window as any).subscribeToPush = subscribeToPush;
  (window as any).testPushSubscription = testPushSubscription;
  
  console.log(`
🔔 Notification Test Functions Available:
- checkSWStatus() - Check service worker registration status
- testNotification() - Test browser notification
- testSWNotification() - Test service worker notification
- subscribeToPush() - Subscribe to push notifications
- testPushSubscription() - Check push subscription status
  `);
}
