'use client';

import dynamic from 'next/dynamic';
import InstallPrompt from './InstallPrompt';
import UpdateNotification from './UpdateNotification';

// Lazy load heavy components
const NotificationManager = dynamic(() => import('../notifications/NotificationManager'), { ssr: false });
const OfflineSyncIndicator = dynamic(() => import('../offline/OfflineSyncIndicator'), { ssr: false });

export default function PWAProvider() {
  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
      <NotificationManager />
      <OfflineSyncIndicator />
    </>
  );
}
