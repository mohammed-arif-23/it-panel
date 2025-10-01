import { useQuery } from '@tanstack/react-query'

interface DashboardData {
  assignments?: any[]
  seminarBookings?: any[]
  fines?: any[]
  completed_assignments?: number
  pending_assignments?: number
  stats?: {
    totalAssignments?: number
    submittedAssignments?: number
    totalFines?: number
    pendingFines?: number
  }
}

interface FinesData {
  fines: any[]
  stats: {
    totalFines: number
    pendingFines: number
    paidFines: number
  }
}

export function useDashboardData(studentId: string) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?studentId=${studentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      return data.success ? data.data : {}
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useFinesData(studentId: string) {
  return useQuery<FinesData>({
    queryKey: ['fines', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/fines?studentId=${studentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch fines data')
      }
      const data = await response.json()
      return data.success ? data.data : { fines: [], stats: { totalFines: 0, pendingFines: 0, paidFines: 0 } }
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
