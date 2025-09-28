import { useQuery } from '@tanstack/react-query'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
  password?: string | null
}

export function useStudentSearch(searchTerm: string) {
  return useQuery<Student[]>({
    queryKey: ['students', 'search', searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return []
      
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchTerm)}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to search students')
      }
      const result = await response.json()
      return result.success ? (result.data || []) : []
    },
    enabled: searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
