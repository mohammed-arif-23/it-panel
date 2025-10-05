'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import { 
  Bell,
  ArrowLeft,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  Filter,
  Megaphone,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Loader from '@/components/ui/loader'
import PageTransition from '../../components/ui/PageTransition'
import { SkeletonCard } from '../../components/ui/skeletons'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/animations'
import { useQueryClient } from '@tanstack/react-query'

interface Notice {
  id: string
  title: string
  content: string
  notice_type: string
  priority: string
  target_audience: string
  is_published: boolean
  published_at: string
  expires_at: string | null
  attachment_url: string | null
  attachment_name: string | null
  views_count: number
  created_by: string
  created_at: string
  has_viewed?: boolean
  has_acknowledged?: boolean
}

const priorityColors = {
  urgent: 'bg-red-50 border-red-200',
  high: 'bg-orange-50 border-orange-200',
  medium: 'bg-blue-50 border-blue-200',
  low: 'bg-gray-50 border-gray-200',
}

const priorityIcons = {
  urgent: AlertTriangle,
  high: AlertCircle,
  medium: Info,
  low: Bell,
}

const priorityTextColors = {
  urgent: 'text-red-800',
  high: 'text-orange-800',
  medium: 'text-blue-800',
  low: 'text-gray-800',
}

const noticeTypeLabels = {
  general: 'General',
  urgent: 'Urgent',
  event: 'Event',
  exam: 'Exam',
  holiday: 'Holiday',
  announcement: 'Announcement',
  academic: 'Academic',
  administrative: 'Administrative',
}

export default function NoticePage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    fetchNotices()
  }, [user, router])

  useEffect(() => {
    applyFilters()
  }, [notices, filterType, filterPriority])

  const fetchNotices = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        student_id: user?.id || '',
        class_year: user?.class_year || '',
      })
      
      const response = await fetch(`/api/notices?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setNotices(data.notices || [])
      } else {
        console.error('Failed to fetch notices:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...notices]
    
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.notice_type === filterType)
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority)
    }
    
    setFilteredNotices(filtered)
  }

  const markAsViewed = async (noticeId: string) => {
    try {
      await fetch('/api/notices/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notice_id: noticeId,
          student_id: user?.id,
        }),
      })
      
      // Invalidate queries to refetch updated data from server
      queryClient.invalidateQueries({ queryKey: ['noticeCount', user?.id, user?.class_year] })
      
      // Refetch notices to update UI with has_viewed status
      await fetchNotices()
    } catch (error) {
      console.error('Error marking notice as viewed:', error)
    }
  }

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
    if (!notice.has_viewed) {
      markAsViewed(notice.id)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = notices.filter(n => !n.has_viewed).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-32 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full skeleton animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (selectedNotice) {
    const PriorityIcon = priorityIcons[selectedNotice.priority as keyof typeof priorityIcons] || Bell
    
    return (
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSelectedNotice(null)}
              className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Notices</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className={`saas-card p-6 ${priorityColors[selectedNotice.priority as keyof typeof priorityColors]}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${selectedNotice.priority === 'urgent' ? 'bg-red-100' : selectedNotice.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'} rounded-lg`}>
                  <PriorityIcon className={`w-5 h-5 ${selectedNotice.priority === 'urgent' ? 'text-red-600' : selectedNotice.priority === 'high' ? 'text-orange-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${selectedNotice.priority === 'urgent' ? 'bg-red-600' : selectedNotice.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'} text-white`}>
                      {selectedNotice.priority.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                      {noticeTypeLabels[selectedNotice.notice_type as keyof typeof noticeTypeLabels]}
                    </span>
                  </div>
                </div>
              </div>
              {selectedNotice.has_viewed && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Read</span>
                </div>
              )}
            </div>

            <h1 className={`text-2xl font-bold mb-4 ${priorityTextColors[selectedNotice.priority as keyof typeof priorityTextColors]}`}>
              {selectedNotice.title}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedNotice.published_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{selectedNotice.views_count} views</span>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedNotice.content}
              </p>
            </div>

            {selectedNotice.attachment_url && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      {selectedNotice.attachment_name || 'Attachment'}
                    </span>
                  </div>
                  <a
                    href={selectedNotice.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            {selectedNotice.expires_at && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Expires on: {formatDate(selectedNotice.expires_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </PageTransition>
    )
  }

  return (
    <PullToRefresh onRefresh={fetchNotices}>
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between px-4 py-2">
            <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-[var(--color-primary)]">Notices</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
              <img src="/icons/android/android-launchericon-512-512.png" 
              className='w-12 h-12 p-0'
              alt="Logo"/>
          </div>

          {showFilters && (
            <div className="p-4 bg-[var(--color-accent)] border-t border-[var(--color-border-light)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg bg-white text-sm"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(noticeTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg bg-white text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No notices available</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for updates</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const PriorityIcon = priorityIcons[notice.priority as keyof typeof priorityIcons] || Bell
              
              return (
                <motion.button
                  key={notice.id}
                  onClick={() => handleNoticeClick(notice)}
                  className={`w-full text-left saas-card p-4 ${!notice.has_viewed ? 'border-l-4 border-l-blue-500' : ''} ${priorityColors[notice.priority as keyof typeof priorityColors]}`}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 ${notice.priority === 'urgent' ? 'bg-red-100' : notice.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'} rounded-lg`}>
                        <PriorityIcon className={`w-4 h-4 ${notice.priority === 'urgent' ? 'text-red-600' : notice.priority === 'high' ? 'text-orange-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${notice.priority === 'urgent' ? 'bg-red-600' : notice.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'} text-white`}>
                            {notice.priority.toUpperCase()}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                            {noticeTypeLabels[notice.notice_type as keyof typeof noticeTypeLabels]}
                          </span>
                        </div>
                        <h3 className={`font-bold text-base ${priorityTextColors[notice.priority as keyof typeof priorityTextColors]} line-clamp-2`}>
                          {notice.title}
                        </h3>
                      </div>
                    </div>
                    {!notice.has_viewed && (
                      <div className="ml-2 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {notice.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(notice.published_at)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {notice.attachment_url && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Download className="w-3 h-3" />
                          <span>Attachment</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{notice.views_count}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>
      </PageTransition>
    </PullToRefresh>
  )
}
