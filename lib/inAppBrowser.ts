import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Open URL in-app browser (for native apps) or new tab (for web)
 */
export async function openInAppBrowser(url: string) {
  if (!url) return;

  // If running in native app, use in-app browser
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ 
      url,
      presentationStyle: 'popover',
      toolbarColor: '#FAFAFF'
    });
  } else {
    // On web, open in new tab
    window.open(url, '_blank');
  }
}

/**
 * Close the in-app browser
 */
export async function closeInAppBrowser() {
  if (Capacitor.isNativePlatform()) {
    await Browser.close();
  }
}

/**
 * Hook to intercept external links and open them in-app
 */
export function setupInAppBrowserLinks() {
  if (typeof window === 'undefined') return;

  // List of PWA domains that should open in the main WebView (not in-app browser)
  const pwaDomainsToOpenInWebView = [
    'it-panel-beta.vercel.app',
    'no-due-generator-app.vercel.app',
    'dynamit-learn.vercel.app'
  ];

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;

    // Check if it's an external link
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    const isCurrentDomain = href.includes(window.location.hostname);
    
    if (isExternal && !isCurrentDomain && Capacitor.isNativePlatform()) {
      // Check if it's one of our PWA domains that should open in WebView
      const isPWADomain = pwaDomainsToOpenInWebView.some(domain => href.includes(domain));
      
      if (isPWADomain) {
        // Open PWA links in the main WebView (same window)
        e.preventDefault();
        window.location.href = href;
      } else {
        // Open other external links in in-app browser
        e.preventDefault();
        openInAppBrowser(href);
      }
    }
  });
}
