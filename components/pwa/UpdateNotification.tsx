'use client';

import { useEffect, useState } from 'react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check for service worker updates
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check for updates every 60 seconds
      setInterval(() => {
        reg.update();
      }, 60000);
    });

    // Listen for new service worker waiting to activate
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Detect when a new service worker is waiting
    const onUpdateFound = () => {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setShowUpdate(true);
        }

        if (reg.installing) {
          reg.installing.addEventListener('statechange', (e: Event) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true);
            }
          });
        }
      });
    };

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setShowUpdate(true);
      }
    });

    onUpdateFound();
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdate(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Show again after 1 hour
    setTimeout(() => setShowUpdate(true), 60 * 60 * 1000);
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
                className="flex-1 bg-white text-green-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-all shadow-md"
              >
                Update Now
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
