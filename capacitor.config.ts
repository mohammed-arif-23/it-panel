import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dynamit.arif',
  appName: 'dynamIT',
  webDir: 'out', // Fallback directory (not used with server.url)
  server: {
    // Load from your remote server - this is correct for your PWA
    url: 'https://it-panel-beta.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    // Allow navigation to other PWA domains
    allowNavigation: [
      'it-panel-beta.vercel.app',
      'no-due-generator-app.vercel.app',
      'dynamit-learn.vercel.app',
      '*.vercel.app'
    ]
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // Disable in production
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#667eea",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    Filesystem: {
      iosScheme: "file",
      androidScheme: "content"
    }
  }
};

export default config;
