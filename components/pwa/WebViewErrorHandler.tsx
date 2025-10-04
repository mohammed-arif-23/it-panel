'use client'

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { RefreshCw, Wifi, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

// Type guard for window object
const isWindowAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'location' in window && window.location !== null;
};

export default function WebViewErrorHandler() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Only for native apps
    }

    // Monitor for WebView loading issues
    const checkWebViewStatus = () => {
      // Check if the page has loaded content
      const hasContent = document.body && document.body.children.length > 0;
      const hasReactRoot = document.getElementById('__next') || document.querySelector('[data-reactroot]');
      
      // If after 10 seconds we don't have content, show error
      setTimeout(() => {
        if (!hasContent && !hasReactRoot) {
          console.warn('WebView appears to have loading issues');
          setHasError(true);
        }
      }, 10000);
    };

    // Check for network errors
    window.addEventListener('error', (event) => {
      if (event.message.includes('net::') || event.message.includes('ERR_')) {
        console.error('Network error detected:', event.message);
        setHasError(true);
      }
    });

    // Check for unhandled promise rejections (often network related)
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('fetch')) {
        console.error('Fetch error detected:', event.reason);
        setHasError(true);
      }
    });

    checkWebViewStatus();
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Force reload the WebView
    setTimeout(() => {
      if (isWindowAvailable()) {
        window.location.reload();
      }
    }, 500);
  };

  const handleForceReload = () => {
    setIsLoading(true);
    
    // Clear cache and reload
    if (isWindowAvailable() && 'caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name))).then(() => {
          if (isWindowAvailable()) {
            window.location.reload();
          }
        });
      }).catch(() => {
        if (isWindowAvailable()) {
          window.location.reload();
        }
      });
    } else {
      // Direct reload if caches not available
      if (isWindowAvailable()) {
        window.location.reload();
      }
    }
  };

  if (!hasError || !Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Issue</h2>
        <p className="text-gray-600 mb-6">
          The app is having trouble loading. This might be due to a network issue or server problem.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Retry Connection
          </Button>
          
          <Button
            onClick={handleForceReload}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Clear Cache & Reload
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If the problem persists, please check your internet connection or contact support.
        </p>
      </div>
    </div>
  );
}
