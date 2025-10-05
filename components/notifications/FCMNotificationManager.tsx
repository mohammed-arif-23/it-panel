'use client';

import { useEffect, useState } from 'react';
import { FCMClient } from '@/lib/fcmClient';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  lastMessage: any;
}

export default function FCMNotificationManager() {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null,
    lastMessage: null
  });

  const [fcmClient, setFcmClient] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const client = FCMClient.getInstance();
        setFcmClient(client);
        
        setState(prev => ({
          ...prev,
          isSupported: client.isSupported(),
          permission: client.getPermissionStatus(),
          isSubscribed: client.isSubscribed()
        }));

        // Set up foreground message listener
        const unsubscribe = client.onMessage((payload) => {
          setState(prev => ({ ...prev, lastMessage: payload }));
          
          // Show in-app notification
          if (payload.notification) {
            showInAppNotification(payload.notification);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('FCM initialization error:', error);
        setState(prev => ({ ...prev, error: 'Failed to initialize notifications' }));
      }
    }
  }, []);

  const showInAppNotification = (notification: any) => {
    // Create a custom in-app notification
    const notificationElement = document.createElement('div');
    notificationElement.className = 'fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm';
    notificationElement.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
          </div>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
          <p class="text-sm text-gray-600 mt-1">${notification.body}</p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notificationElement);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.remove();
      }
    }, 5000);
  };

  const handleSubscribe = async () => {
    if (!user?.id || !fcmClient) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fcmClient.subscribe(user.id);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          permission: 'granted',
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to subscribe',
          isLoading: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to subscribe',
        isLoading: false
      }));
    }
  };

  const handleUnsubscribe = async () => {
    if (!fcmClient) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fcmClient.unsubscribe();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to unsubscribe',
          isLoading: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to unsubscribe',
        isLoading: false
      }));
    }
  };

  if (!state.isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Push notifications are not supported in this browser
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              state.isSubscribed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {state.isSubscribed ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600">
                {state.isSubscribed 
                  ? 'You will receive notifications from the college'
                  : 'Enable notifications to stay updated'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={state.isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={state.isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              state.isSubscribed
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {state.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : state.isSubscribed ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{state.error}</span>
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Status */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Permission: <span className="font-medium">{state.permission}</span></div>
        <div>Status: <span className="font-medium">{state.isSubscribed ? 'Subscribed' : 'Not subscribed'}</span></div>
        {fcmClient && fcmClient.getCurrentToken() && (
          <div>Token: <span className="font-mono">{fcmClient.getCurrentToken()?.substring(0, 20)}...</span></div>
        )}
      </div>
    </div>
  );
}
