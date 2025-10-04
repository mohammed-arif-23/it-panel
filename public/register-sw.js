// Register service worker with push notification support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
        
        // Import custom push handlers
        if (registration.active) {
          importScripts('/sw-custom.js');
        }
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('SW update found:', newWorker);
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}
