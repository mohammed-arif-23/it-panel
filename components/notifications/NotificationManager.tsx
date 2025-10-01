'use client'

import { useState, useEffect } from 'react'
import { notificationService } from '../../lib/notificationService'
import { Bell, X } from 'lucide-react'
import { Button } from '../ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(notificationService.getPermissionStatus())
      
      // Show prompt after 10 seconds on first visit
      const hasSeenPrompt = localStorage.getItem('notification_prompt_seen')
      if (!hasSeenPrompt && permission === 'default') {
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 10000) // 10 seconds

        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    try {
      const result = await notificationService.requestPermission()
      setPermission(result)
      setShowPrompt(false)
      localStorage.setItem('notification_prompt_seen', 'true')
      
      if (result === 'granted') {
        // Show success notification
        await notificationService.showLocalNotification({
          title: '🔔 Notifications Enabled',
          body: "You'll now receive important updates about assignments, seminars, and more!",
          tag: 'notification-enabled'
        })
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_seen', 'true')
    setShowPrompt(false)
  }

  if (!notificationService.isSupported()) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border border-gray-200"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Enable Notifications</h3>
                  <p className="text-sm text-gray-600">Stay updated with important alerts</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
                <ul className="space-y-1">
                  <li>📝 Assignment deadlines</li>
                  <li>🎤 Seminar selections</li>
                  <li>💰 Fine reminders</li>
                  <li>💡 Concept of the Day</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleEnableNotifications}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Enable Notifications
                </Button>
                <Button
                  onClick={handleDismiss}
                  className="px-4 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Later
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
