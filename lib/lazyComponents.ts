// Lazy loaded components for code splitting
// Import these instead of direct imports for better performance

import dynamic from 'next/dynamic'

// Assignment Components
export const LazyAssignmentCard = dynamic(
  () => import('../components/assignments/AssignmentCard').then(mod => ({ default: mod.AssignmentCard })),
  { ssr: false }
)

export const LazyProgressiveAssignmentSubmission = dynamic(
  () => import('../components/assignments/ProgressiveAssignmentSubmission').then(mod => ({ default: mod.ProgressiveAssignmentSubmission })),
  { ssr: false }
)

// Seminar Components
export const LazyProgressivePresenterHistory = dynamic(
  () => import('../components/seminar/ProgressivePresenterHistory').then(mod => ({ default: mod.ProgressivePresenterHistory })),
  { ssr: false }
)

// Notification Components
export const LazyNotificationManager = dynamic(
  () => import('../components/notifications/NotificationManager'),
  { ssr: false }
)

// Offline Sync Components
export const LazyOfflineSyncIndicator = dynamic(
  () => import('../components/offline/OfflineSyncIndicator'),
  { ssr: false }
)
