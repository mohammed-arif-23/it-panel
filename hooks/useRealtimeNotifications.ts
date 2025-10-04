import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notificationService'

interface RealtimeNotificationsProps {
  studentId?: string | null
  classYear?: string | null
  enabled?: boolean
}

export function useRealtimeNotifications({ 
  studentId, 
  classYear, 
  enabled = true 
}: RealtimeNotificationsProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !studentId || !classYear) return

    // Subscribe to notices changes - unique channel per user
    const noticesChannel = supabase
      .channel(`notices-changes-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_notices',
          filter: `is_published=eq.true`
        },
        (payload) => {
          const notice = payload.new as any
          
          // Check if notice is for this student's class
          if (
            notice.target_audience === 'all' || 
            notice.target_audience === classYear
          ) {
            // Invalidate notices queries
            queryClient.invalidateQueries({ queryKey: ['noticeCount'] })
            
            // Show notification
            const checkAndShowNotification = async () => {
              const permission = await notificationService.getPermissionStatus()
              if (permission === 'granted') {
                notificationService.showLocalNotification({
                  title: '📢 New Notice',
                  body: notice.title,
                  tag: `notice-${notice.id}`,
                  data: { type: 'notice', id: notice.id }
                })
              }
            }
            checkAndShowNotification()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'unified_notices',
          filter: `is_published=eq.true`
        },
        () => {
          // Invalidate notices queries when updated
          queryClient.invalidateQueries({ queryKey: ['noticeCount'] })
        }
      )
      .subscribe()

    // Subscribe to assignments changes - unique channel per user
    const assignmentsChannel = supabase
      .channel(`assignments-changes-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_assignments',
          filter: `class_year=eq.${classYear}`
        },
        (payload) => {
          const assignment = payload.new as any
          
          // Invalidate assignments queries
          queryClient.invalidateQueries({ queryKey: ['assignments'] })
          
          // Show notification
          const checkAssignmentNotification = async () => {
            const permission = await notificationService.getPermissionStatus()
            if (permission === 'granted') {
              const dueDate = new Date(assignment.due_date).toLocaleDateString()
              notificationService.notifyNewAssignment(assignment.title, dueDate)
            }
          }
          checkAssignmentNotification()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'unified_assignment_submissions',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          const submission = payload.new as any
          
          // Invalidate assignments queries when graded
          if (submission.marks !== null) {
            queryClient.invalidateQueries({ queryKey: ['assignments'] })
            
            // Show notification for graded assignment
            const checkGradedNotification = async () => {
              const permission = await notificationService.getPermissionStatus()
              if (permission === 'granted') {
                notificationService.showLocalNotification({
                  title: '✅ Assignment Graded',
                  body: `Your assignment has been graded: ${submission.marks}/10`,
                  tag: `graded-${submission.id}`,
                  data: { type: 'assignment', id: submission.assignment_id }
                })
              }
            }
            checkGradedNotification()
          }
        }
      )
      .subscribe()

    // Subscribe to fines changes - unique channel per user
    const finesChannel = supabase
      .channel(`fines-changes-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_student_fines',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          const fine = payload.new as any
          
          // Invalidate dashboard queries
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
          
          // Show notification
          const checkFineNotification = async () => {
            const permission = await notificationService.getPermissionStatus()
            if (permission === 'granted') {
              const amount = fine.base_amount + (fine.daily_increment * fine.days_overdue)
              notificationService.notifyFineReminder(amount, fine.fine_type.replace('_', ' '))
            }
          }
          checkFineNotification()
        }
      )
      .subscribe()

    // Subscribe to seminar selections - unique channel per user
    const seminarChannel = supabase
      .channel(`seminar-changes-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_seminar_selections',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          const selection = payload.new as any
          
          // Invalidate seminar queries
          queryClient.invalidateQueries({ queryKey: ['seminarData'] })
          
          // Show notification
          const checkSeminarNotification = async () => {
            const permission = await notificationService.getPermissionStatus()
            if (permission === 'granted') {
              const date = new Date(selection.seminar_date).toLocaleDateString()
              notificationService.notifySeminarSelection('You', date)
            }
          }
          checkSeminarNotification()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(noticesChannel)
      supabase.removeChannel(assignmentsChannel)
      supabase.removeChannel(finesChannel)
      supabase.removeChannel(seminarChannel)
    }
  }, [studentId, classYear, enabled]) // Removed queryClient to prevent memory leak
}
