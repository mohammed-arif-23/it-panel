import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Initialize deep linking for the app
 * Handles URLs like: dynamit://assignments/123
 */
export function initializeDeepLinking(router: any) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Listen for app URL open events
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    console.log('🔗 Deep link opened:', event.url);
    
    // Parse the URL
    const url = new URL(event.url);
    
    // Handle different URL schemes
    if (url.protocol === 'dynamit:') {
      const path = url.pathname || url.host;
      
      // Navigate to the appropriate page
      if (path) {
        console.log('📱 Navigating to:', path);
        router.push(path);
      }
    } else if (url.protocol === 'https:') {
      // Handle https:// deep links (from notifications)
      const pathname = url.pathname;
      if (pathname && pathname !== '/') {
        console.log('📱 Navigating to:', pathname);
        router.push(pathname);
      }
    }
  });

  console.log('✅ Deep linking initialized');
}

/**
 * Handle notification tap navigation
 */
export function handleNotificationNavigation(url: string, router: any) {
  if (!url) return;
  
  // Remove domain if present
  let path = url;
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch (e) {
      console.error('Invalid URL:', url);
      return;
    }
  }
  
  // Navigate to the path
  console.log('🔔 Notification navigation to:', path);
  router.push(path);
}
