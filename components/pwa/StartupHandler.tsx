'use client'

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

interface StartupHandlerProps {
  children: React.ReactNode;
}

export default function StartupHandler({ children }: StartupHandlerProps) {
  const [isReady, setIsReady] = useState(!Capacitor.isNativePlatform());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip native initialization for web
    }

    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing native app...');

        // Configure status bar
        if (Capacitor.isPluginAvailable('StatusBar')) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#667eea' });
        }

        // Handle app state changes
        if (Capacitor.isPluginAvailable('App')) {
          App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active?', isActive);
            if (isActive) {
              // App became active - refresh if needed
              console.log('App resumed - checking for updates...');
            }
          });

          App.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              App.exitApp();
            } else {
              window.history.back();
            }
          });
        }

        // Wait a bit longer before hiding splash screen to ensure WebView is loaded
        setTimeout(async () => {
          if (Capacitor.isPluginAvailable('SplashScreen')) {
            await SplashScreen.hide();
          }
          setIsReady(true);
          console.log('✅ Native app initialized successfully');
        }, 2000); // Wait 2 seconds for WebView to load

      } catch (error) {
        console.error('❌ Failed to initialize native app:', error);
        setError('Failed to initialize app. Please restart the application.');
        
        // Still show the app even if some features fail
        setTimeout(() => {
          setIsReady(true);
          if (Capacitor.isPluginAvailable('SplashScreen')) {
            SplashScreen.hide();
          }
        }, 3000);
      }
    };

    // Initialize immediately - don't wait
    initializeApp();
  }, []);

  // Show loading screen for native apps while initializing
  if (!isReady && Capacitor.isNativePlatform()) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">dynamIT</h2>
          {error ? (
            <p className="text-red-200 text-sm">{error}</p>
          ) : (
            <p className="text-blue-100">Connecting to server...</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
