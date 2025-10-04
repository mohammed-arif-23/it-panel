'use client'

import { useEffect } from 'react';
import { setupInAppBrowserLinks } from '../../lib/inAppBrowser';
import { Capacitor } from '@capacitor/core';

export default function CapacitorInit() {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize enhanced notification service
        const { enhancedNotificationService } = await import('../../lib/enhancedNotificationService');
        const notificationSuccess = await enhancedNotificationService.initialize();
        
        if (notificationSuccess) {
          console.log('✅ Enhanced notifications initialized');
          // Battery optimization prompt disabled for now per request
          // await enhancedNotificationService.requestBatteryOptimizationWhitelist();
        }

        // Initialize network handler
        const { networkHandler } = await import('../../lib/networkHandler');
        await networkHandler.initialize();
        console.log('✅ Network handler initialized');

        // Initialize comprehensive error handler
        const { comprehensiveErrorHandler } = await import('../../lib/comprehensiveErrorHandler');
        comprehensiveErrorHandler.initialize();
        console.log('✅ Error handler initialized');

        // Setup in-app browser for external links
        setupInAppBrowserLinks();
        console.log('✅ In-app browser links initialized');

        // Initialize unified service worker manager
        const { unifiedServiceWorkerManager } = await import('../../lib/unifiedServiceWorker');
        await unifiedServiceWorkerManager.initialize();
        console.log('✅ Unified service worker initialized');

        // Configure StatusBar for better readability and spacing on Android/iOS
        if (Capacitor.isNativePlatform()) {
          try {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            // Do NOT overlay WebView so content is below the status bar
            await StatusBar.setOverlaysWebView({ overlay: false });
            // Match app background so no visible cutoff bar
            await StatusBar.setBackgroundColor({ color: '#FAFAFF' });
            // Dark icons/text for light background
            await StatusBar.setStyle({ style: Style.Dark });
            console.log('✅ StatusBar configured');
          } catch (err) {
            console.warn('⚠️ Failed to configure StatusBar', err);
          }
        }

      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      // Cleanup will be handled by individual services
    };
  }, []);

  return null; // This component doesn't render anything
}

