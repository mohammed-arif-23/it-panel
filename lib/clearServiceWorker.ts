/**
 * Utility to clear all service workers and caches
 * Run this from browser console: clearAllServiceWorkers()
 */

export async function clearAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker not supported');
    return;
  }

  try {
    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker(s)`);
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('✅ Unregistered service worker:', registration.scope);
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s)`);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Deleted cache:', cacheName);
      }
    }

    console.log('✅ All service workers and caches cleared!');
    console.log('🔄 Please reload the page to register fresh service worker');
  } catch (error) {
    console.error('❌ Error clearing service workers:', error);
  }
}

// Make function available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).clearAllServiceWorkers = clearAllServiceWorkers;
  
  console.log(`
🧹 Service Worker Cleanup Available:
- clearAllServiceWorkers() - Remove all service workers and caches
  `);
}
