import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin } from '../lib/supabase'

interface StudentResult {
  stu_reg_no: string
  stu_name: string
  res_data: Record<string, string>
}

interface ResultDocument {
  _id: string
  sheet_id: number
  department: string
  year: string
  year_num: number
  semester: number
  batch: string
  exam_cycle: string
  last_updated: string
  student_data: StudentResult
}

interface ResultsResponse {
  message: string
  results: ResultDocument[]
  total_semesters: number
}

export function useResults(registerNumber: string, enabled: boolean = true) {
  return useQuery<ResultsResponse>({
    queryKey: ['results', registerNumber],
    queryFn: async () => {
      if (!registerNumber) {
        throw new Error('Register number is required')
      }

      const response = await fetch(`/api/results?register_number=${encodeURIComponent(registerNumber)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch results')
      }

      return response.json()
    },
    enabled: enabled && !!registerNumber && registerNumber.length > 0,
    staleTime: 0, // Disable cache to get fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  })
}

// Grade to Grade-Point mapping (exact as specified)
function getGradePoint(grade: string): number {
  const gradeMap: Record<string, number> = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'U': 0  // U is treated specially in arrear rule
  }
  
  const gradePoint = gradeMap[grade] ?? 0
  return gradePoint
}

// Helper function to get grade color for UI
export function getGradeColor(grade: string): string {
  const gradeColors: Record<string, string> = {
    'O': 'text-green-600 bg-green-50',
    'A+': 'text-green-500 bg-green-50',
    'A': 'text-blue-600 bg-blue-50',
    'B+': 'text-blue-500 bg-blue-50',
    'B': 'text-yellow-600 bg-yellow-50',
    'C': 'text-orange-600 bg-orange-50',
    'U': 'text-red-600 bg-red-50',
    'UA': 'text-gray-600 bg-gray-50',
  }
  return gradeColors[grade] || 'text-gray-600 bg-gray-50'
}

// Hook to fetch subject credits and GPA inclusion flags from Supabase
export function useSubjectCredits() {
  return useQuery({
    queryKey: ['subject-credits'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('code, credits, is_skill_based, is_ncc_course, is_non_credit, course_type, category')

      if (error) {
        throw error
      }

      // Convert to a map for easy lookup — store EXACT numeric credits only (no fallbacks)
      const creditsMap: Record<string, number> = {}
      data?.forEach((subject: any) => {
        if (typeof subject.credits === 'number') {
          creditsMap[subject.code] = subject.credits
        }
      })

      return creditsMap
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Fixed semester credit totals (as per university standards)
const SEMESTER_CREDIT_TOTALS: Record<number, number> = {
  1: 22,
  2: 26,
  3: 23.5,
  4: 22,
  5: 22,
  6: 22,
  7: 22,
  8: 22
}

// Helper function to check if semester has any U grades
function hasUGrades(grades: Record<string, string>): boolean {
  return Object.values(grades).some(grade => grade === 'U')
}

// Helper function to calculate GPA using two different rules
export function calculateGPA(
  grades: Record<string, string>,
  subjectCredits?: Record<string, number>,
  semester?: number
): number {
  const subjects = Object.entries(grades)
  if (subjects.length === 0) return 0

  const hasU = hasUGrades(grades)
  
  if (hasU) {
    // ARREAR RULE: Exclude U subjects from both numerator and denominator
    
    let totalWeightedPoints = 0
    let totalCredits = 0

    subjects.forEach(([subjectCode, grade]) => {
      if (grade === 'U') {
        return // Skip U grades entirely
      }
      
      const gradePoint = getGradePoint(grade)
      const credits = subjectCredits?.[subjectCode]
      
      if (typeof credits !== 'number') {
        return
      }
      
      const weightedPoints = credits * gradePoint
      
      totalWeightedPoints += weightedPoints
      totalCredits += credits
    })

    const gpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0
    const roundedGpa = Math.round(gpa * 100) / 100
    
    return roundedGpa
    
  } else {
    // UNIVERSITY RULE: Use fixed semester credit total
    const fixedSemesterCredits = semester ? SEMESTER_CREDIT_TOTALS[semester] : null
    
    let totalWeightedPoints = 0

    subjects.forEach(([subjectCode, grade]) => {
      const gradePoint = getGradePoint(grade)
      const credits = subjectCredits?.[subjectCode]
      
      if (typeof credits !== 'number') {
        return
      }
      
      const weightedPoints = credits * gradePoint
      
      totalWeightedPoints += weightedPoints
    })

    // Use fixed semester credits if available, otherwise fall back to sum of individual credits
    const denominatorCredits = fixedSemesterCredits || subjects.reduce((sum, [subjectCode]) => {
      const credits = subjectCredits?.[subjectCode]
      return sum + (typeof credits === 'number' ? credits : 0)
    }, 0)
    
    const gpa = denominatorCredits > 0 ? totalWeightedPoints / denominatorCredits : 0
    const roundedGpa = Math.round(gpa * 100) / 100
    
    return roundedGpa
  }
}

// Helper function to get semester performance status
export function getSemesterStatus(gpa: number): { status: string; color: string } {
  if (gpa >= 9) return { status: 'Excellent', color: 'text-green-600' }
  if (gpa >= 8) return { status: 'Very Good', color: 'text-blue-600' }
  if (gpa >= 7) return { status: 'Good', color: 'text-blue-500' }
  if (gpa >= 6) return { status: 'Average', color: 'text-yellow-600' }
  if (gpa >= 5) return { status: 'Below Average', color: 'text-orange-600' }
  return { status: 'Poor', color: 'text-red-600' }
}
