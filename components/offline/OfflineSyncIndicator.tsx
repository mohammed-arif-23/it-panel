'use client'

import { useState, useEffect } from 'react'
import { offlineSyncService } from '../../lib/offlineSyncService'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState('')
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)
    updateQueueCount()

    // Subscribe to sync events
    const unsubscribe = offlineSyncService.subscribe((status) => {
      setSyncStatus(status)
      setShowStatus(true)
      updateQueueCount()
      
      setTimeout(() => setShowStatus(false), 3000)
    })

    // Online/offline listeners
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update queue count periodically
    const interval = setInterval(updateQueueCount, 5000)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const updateQueueCount = async () => {
    const count = await offlineSyncService.getQueueCount()
    setQueueCount(count)
  }

  const handleManualSync = async () => {
    setSyncStatus('Syncing...')
    setShowStatus(true)
    await offlineSyncService.syncAll()
    await updateQueueCount()
  }

  if (!isOnline) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium slide-in-left"
        >
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Changes will be saved and synced later.</span>
            {queueCount > 0 && (
              <span className="bg-yellow-600 px-2 py-0.5 rounded-full text-xs">
                {queueCount} pending
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (queueCount > 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium slide-in-left"
        >
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Syncing {queueCount} pending operation{queueCount > 1 ? 's' : ''}...</span>
            <button
              onClick={handleManualSync}
              className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition-colors"
            >
              Sync Now
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (showStatus) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm font-medium"
        >
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{syncStatus}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}
