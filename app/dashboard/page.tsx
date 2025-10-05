'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useNoticeCount } from '../../hooks/useNoticeCount'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import { useRouter } from 'next/navigation'
import '../../lib/testNotification'
import '../../lib/clearServiceWorker'
import FCMNotificationManager from '../../components/notifications/FCMNotificationManager'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import Loader from '../../components/ui/loader'
import Link from 'next/link'
import Image from 'next/image'
import { SkeletonDashboardTile } from '../../components/ui/skeletons'
import ProgressiveLoader from '../../components/ui/ProgressiveLoader'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/animations'
import PageTransition from '../../components/ui/PageTransition'
import { 
  BookOpen,
  FileText,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  ClipboardList,
  IndianRupee,
  GraduationCap,
  FileCheck,
  Lightbulb,
  FlaskConical,
  CalendarClock,
  UserCheck,
  Award,
  StickyNote,
  Library,
  Bell,
  MessageCircle,
  Building2,
  Icon
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data: dashboardData, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useDashboardData(user?.id || '')
  const { data: noticeCount } = useNoticeCount(user?.id || '', user?.class_year || '')
  // removed timetable dashboard state
  
  // Enable realtime notifications for backend updates
  useRealtimeNotifications({
    studentId: user?.id ?? undefined,
    classYear: user?.class_year ?? undefined,
    enabled: !!user
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // removed timetable fetch effect

  const handleRefresh = async () => {
    await refetchDashboard()
  }

  // Check if COD is enabled
  const codEnabled = process.env.NEXT_PUBLIC_COD_ENABLED !== 'false'

  const quickTiles = [
    // Reordered for typical usage priority
    { title: 'Timetable', href: '/timetable', icon: CalendarClock },
    { title: 'Assignments', href: '/assignments', icon: FileText },
    { title: 'Seminar', href: '/seminar', icon: ClipboardList },
    ...(codEnabled ? [{ title: 'COD', href: '/COD', icon: Lightbulb }] : []),
    { title: 'Learning', href: '/learn', icon: BookOpen },
    { title: 'No-Due', href: '/nodue', icon: FileCheck },
    { title: "University QP's", href: '/qps', icon: Library },
    { title: 'Lab Manuals', href: '/lab-manuals', icon: FlaskConical },
    { title: 'Notes', href: '/notes', icon: StickyNote },
    { title: 'Notice', href: '/notice', icon: Bell, badge: noticeCount?.unread || 0 },
    { title: 'Fine History', href: '/fines', icon: IndianRupee },
    { title: 'Department Info', href: '/department-info', icon: Building2 },
    { title: 'Profile', href: '/profile', icon: User },
  /*    
    { title: 'NPTEL', href: '/nptel', icon: GraduationCap },
    { title: 'Attendance', href: '/attendance', icon: UserCheck },
    { title: 'Results', href: '/results', icon: Award },
    { title: 'Syllabus', href: '/syllabus', icon: BookOpen },
    { title: 'Feedback', href: '/feedback', icon: MessageCircle },
    { title: 'About Department', href: '/department', icon: Building2 },*/
  ]

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] page-transition pb-20">
        <div className="w-full h-full flex items-center justify-center">
          <Loader/>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="p-4">
            <div className="flex items-center justify-center ">
              <div className="">
                <Image 
                  src="/logo.png" 
                  alt="IT Department Logo" 
                  width={400} 
                  height={400}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {isLoadingDashboard ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-64 mx-auto skeleton animate-pulse" />
                <div className="h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg w-48 mx-auto skeleton animate-pulse" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonDashboardTile key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <motion.h1 
                  className="text-xl pb-3 my-3  font-semibold text-center text-[var(--color-primary)]"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Department of Information Technology
                </motion.h1>
                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {quickTiles.map((tile, index) => {
                    const Icon = tile.icon
                    return (
                      <motion.div
                        key={tile.href}
                        variants={staggerItem}
                      >
                      <Link
                        href={tile.href}
                        className="saas-card  p-4 text-center hover:shadow-md transition-all duration-200 ripple block h-[100px] flex flex-col items-center justify-center relative"
                      >    
                        <div className="w-12 h-12 shimmer bg-[var(--color-accent)] rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                          <Icon className="w-6 h-6 text-[var(--color-secondary)] mx-auto" />
                          {tile.badge !== undefined && tile.badge > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 500,
                                damping: 15
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
                            >
                              {tile.badge > 99 ? '99+' : tile.badge}
                            </motion.span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">{tile.title}</span>
                      </Link>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
              {/* Timetable card removed as requested */}
              
              {/* FCM Notification Manager - Temporarily disabled */}
              {/* <div className="mt-6">
                <FCMNotificationManager />
              </div> */}
            </div>
          )}
        </div>
      </div>
      </PageTransition>
    </PullToRefresh>
  )
}
