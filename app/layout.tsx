import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { QueryProvider } from '../components/providers/QueryProvider';
import PWAProvider from '../components/pwa/PWAProvider';
import CapacitorInit from '../components/pwa/CapacitorInit';
import StartupHandler from '../components/pwa/StartupHandler';
import OfflineFallback from '../components/pwa/OfflineFallback';
import WebViewErrorHandler from '../components/pwa/WebViewErrorHandler';
import PermissionHandler from '../components/pwa/PermissionHandler';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import MaintenanceGate from '../components/ui/MaintenanceGate';

export const metadata: Metadata = {
  title: "Department of IT - AVSEC",
  description: "NPTEL Course Tracking and Seminar Booking System",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IT Panel",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Enable safe area insets for notch devices
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const maintenanceEnabled = process.env.NEXT_PUBLIC_MAINTENANCE === '1';
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="IT Panel" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IT Panel" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="shortcut icon" href="/icon-192.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        <style>{`
          html { font-family: 'Poppins', sans-serif; }
        `}</style>
      </head>
      <body className="bg-[var(--color-background)] font-['Rubik']" style={{
        paddingTop: 'var(--safe-area-inset-top)',
        paddingRight: 'var(--safe-area-inset-right)',
        paddingBottom: 'var(--safe-area-inset-bottom)',
        paddingLeft: 'var(--safe-area-inset-left)'
      }}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <StartupHandler>
                <WebViewErrorHandler />
                <OfflineFallback />
                <PWAProvider />
                <CapacitorInit />
                {maintenanceEnabled && <MaintenanceGate />}
                <main className="min-h-screen">
                  {children}
                </main>
              </StartupHandler>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}