'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeLocalStorage } from '../../lib/localStorage';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if ('serviceWorker' in navigator) {
      // Register update handler
      const handleUpdate = (registration: ServiceWorkerRegistration) => {
        const newWorker = registration.installing || registration.waiting;
        if (newWorker) {
          const checkState = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Check if user dismissed update recently (within 1 hour)
              const dismissedAt = safeLocalStorage.getItem('sw_update_dismissed');
              if (dismissedAt) {
                const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
                if (hoursSinceDismissed < 1) {
                  return; // Don't show again within 1 hour
                }
              }
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          };
          newWorker.addEventListener('statechange', checkState);
          checkState(); // Check immediately in case already installed
        }
      };

      navigator.serviceWorker.ready.then((registration) => {
        // Listen for updates
        registration.addEventListener('updatefound', () => handleUpdate(registration));
        
        // Check if there's already a waiting worker
        if (registration.waiting) {
          handleUpdate(registration);
        }
      });

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Check for updates every 30 minutes (more frequent than 1 hour)
      const interval = setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update().catch((err) => {
            console.warn('Service worker update check failed:', err);
          });
        });
      }, 30 * 60 * 1000);

      // Check for update on page visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          navigator.serviceWorker.ready.then((registration) => {
            registration.update().catch((err) => {
              console.warn('Service worker update check failed:', err);
            });
          });
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker && !isUpdating) {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdate(false);
      // Reload will happen automatically via controllerchange event
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Remember dismissal to avoid showing again too soon
    safeLocalStorage.setItem('sw_update_dismissed', Date.now().toString());
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Update Available! 🎉
            </h3>
            <p className="text-xs text-white/90 mb-3">
              A new version of IT Panel is ready. Update now for the latest features and improvements.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
