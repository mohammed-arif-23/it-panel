'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration)

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                console.log('Push notification received in client', event.data)
              }
            })

            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
          })
          .catch((error) => {
            console.error('SW registration failed:', error)
          })
      })
    }
  }, [])

  return null // This component doesn't render anything
}
