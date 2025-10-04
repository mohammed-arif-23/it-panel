'use client'

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

export default function OfflineFallback() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      console.log('🌐 Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      console.log('📡 Connection lost');
    };

    // Initial check
    setIsOnline(navigator.onLine);

    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">
            {isOnline ? 'Connection restored' : 'No internet connection'}
          </span>
        </div>
        
        {isOnline && (
          <Button
            onClick={handleRetry}
            size="sm"
            variant="outline"
            className="bg-white text-red-500 border-white hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
