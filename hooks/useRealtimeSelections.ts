import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Hook to listen for real-time updates to seminar and COD selections
 * Automatically invalidates relevant queries when selections change
 */
export function useRealtimeSelections(studentId?: string, classYear?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!studentId || !classYear) return

    // Listen for seminar selections changes
    const seminarChannel = supabase
      .channel('seminar-selections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'unified_seminar_selections'
        },
        (payload) => {
          console.log('Seminar selection change detected:', payload)
          
          // Invalidate all seminar-related queries immediately
          queryClient.invalidateQueries({ queryKey: ['seminar-dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['presenter-history'] })
          
          // Force refetch for current user's dashboard
          queryClient.refetchQueries({ 
            queryKey: ['seminar-dashboard', studentId, classYear] 
          })
        }
      )
      .subscribe()

    // Listen for COD selections changes
    const codChannel = supabase
      .channel('cod-selections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'unified_cod_selections'
        },
        (payload) => {
          console.log('COD selection change detected:', payload)
          
          // Invalidate all COD-related queries immediately
          queryClient.invalidateQueries({ queryKey: ['cod-dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['cod-presenter-history'] })
          
          // Force refetch for current user's dashboard
          queryClient.refetchQueries({ 
            queryKey: ['cod-dashboard', studentId, classYear] 
          })
        }
      )
      .subscribe()

    // Listen for booking changes (both seminar and COD)
    const seminarBookingChannel = supabase
      .channel('seminar-bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unified_seminar_bookings'
        },
        (payload) => {
          console.log('Seminar booking change detected:', payload)
          
          // Invalidate seminar queries
          queryClient.invalidateQueries({ queryKey: ['seminar-dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
          
          // Force refetch if it's the current user's booking
          if ((payload.new as any)?.student_id === studentId || (payload.old as any)?.student_id === studentId) {
            queryClient.refetchQueries({ 
              queryKey: ['seminar-dashboard', studentId, classYear] 
            })
          }
        }
      )
      .subscribe()

    const codBookingChannel = supabase
      .channel('cod-bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unified_cod_bookings'
        },
        (payload) => {
          console.log('COD booking change detected:', payload)
          
          // Invalidate COD queries
          queryClient.invalidateQueries({ queryKey: ['cod-dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
          
          // Force refetch if it's the current user's booking
          if ((payload.new as any)?.student_id === studentId || (payload.old as any)?.student_id === studentId) {
            queryClient.refetchQueries({ 
              queryKey: ['cod-dashboard', studentId, classYear] 
            })
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(seminarChannel)
      supabase.removeChannel(codChannel)
      supabase.removeChannel(seminarBookingChannel)
      supabase.removeChannel(codBookingChannel)
    }
  }, [studentId, classYear, queryClient])
}

/**
 * Hook specifically for listening to selection changes during selection time
 * Provides more aggressive real-time updates during critical periods
 */
export function useRealtimeSelectionUpdates(studentId?: string, classYear?: string, isSelectionTime: boolean = false) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!studentId || !classYear || !isSelectionTime) return

    // During selection time, listen more aggressively and update immediately
    const aggressiveChannel = supabase
      .channel('aggressive-selection-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_seminar_selections'
        },
        (payload) => {
          console.log('New seminar selection during selection time:', payload)
          
          // Immediately invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['seminar-dashboard'] })
          queryClient.refetchQueries({ 
            queryKey: ['seminar-dashboard', studentId, classYear],
            type: 'active' // Only refetch if query is currently active
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'unified_cod_selections'
        },
        (payload) => {
          console.log('New COD selection during selection time:', payload)
          
          // Immediately invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['cod-dashboard'] })
          queryClient.refetchQueries({ 
            queryKey: ['cod-dashboard', studentId, classYear],
            type: 'active' // Only refetch if query is currently active
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(aggressiveChannel)
    }
  }, [studentId, classYear, isSelectionTime, queryClient])
}
