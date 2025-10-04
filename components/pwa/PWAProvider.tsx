'use client';

import dynamic from 'next/dynamic';
import InstallPrompt from './InstallPrompt';
import UpdateNotification from './UpdateNotification';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

// Lazy load heavy components
const NotificationManager = dynamic(() => import('../notifications/NotificationManager'), { ssr: false });
const OfflineSyncIndicator = dynamic(() => import('../offline/OfflineSyncIndicator'), { ssr: false });

export default function PWAProvider() {
  return (
    <>
      <ServiceWorkerRegistration />
      <InstallPrompt />
      <UpdateNotification />
      <NotificationManager />
      <OfflineSyncIndicator />
    </>
  );
}
