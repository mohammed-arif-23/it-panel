import { useQuery } from '@tanstack/react-query'

interface NoticeCount {
  total: number
  unread: number
  read: number
}

export function useNoticeCount(studentId: string, classYear: string) {
  return useQuery<NoticeCount>({
    queryKey: ['noticeCount', studentId, classYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/notices/count?student_id=${studentId}&class_year=${classYear}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch notice count')
      }
      
      return response.json()
    },
    enabled: !!studentId && !!classYear,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  })
}
