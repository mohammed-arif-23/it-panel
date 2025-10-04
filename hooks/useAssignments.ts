import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  marks: number | null
  submitted_at: string
  status: 'submitted' | 'graded'
}

interface AssignmentWithSubmission extends Assignment {
  submission?: AssignmentSubmission
}

export function useAssignments(studentId: string, classYear: string) {
  return useQuery<AssignmentWithSubmission[]>({
    queryKey: ['assignments', studentId, classYear],
    queryFn: async () => {
      const response = await fetch('/api/assignments/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          class_year: classYear
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load assignments')
      }

      const { data } = await response.json()
      return data || []
    },
    enabled: !!studentId && !!classYear,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (submissionData: {
      assignment_id: string
      student_id: string
      file_url: string
      file_name: string
      file_size: number
      cloudinary_public_id: string
    }) => {
      const response = await fetch('/api/assignments/submit-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save assignment submission'
        let plagiarismData = null
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          
          // Preserve plagiarism detection details
          if (errorData.plagiarism_detected && errorData.matched_student) {
            plagiarismData = errorData.matched_student
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status}). Please try again.`
        }
        
        // Create error with additional plagiarism data
        const error: any = new Error(errorMessage)
        if (plagiarismData) {
          error.plagiarismData = plagiarismData
          error.isPlagiarism = true
        }
        throw error
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}
