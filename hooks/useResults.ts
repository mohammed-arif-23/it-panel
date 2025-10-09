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

// Anna University Grade Points (standard 10-point system)
function getGradePoint(grade: string): number {
  const gradeMap: Record<string, number> = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'D': 4,
    'U': 0,
    'AB': 0,
    'UA': 0,
    'RA': 0,
    'SA': 0,
    'W': 0,
    'WD': 0
  }
  
  const gradePoint = gradeMap[grade] ?? 0
  console.log(`Grade '${grade}' mapped to grade point: ${gradePoint}`)
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
      console.log('🔍 Fetching subject credits from Supabase...')

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('code, credits, is_skill_based, is_ncc_course, is_non_credit, course_type, category')

      if (error) {
        console.error('❌ Error fetching subject credits:', error)
        throw error
      }

      console.log('✅ Subject credits data from Supabase:', data)

      // Convert to a map for easy lookup — store EXACT numeric credits only (no fallbacks)
      const creditsMap: Record<string, number> = {}
      data?.forEach((subject: any) => {
        if (typeof subject.credits === 'number') {
          creditsMap[subject.code] = subject.credits
        } else {
          console.warn(`⚠️ Skipping subject with non-numeric/missing credits in DB: ${subject.code}`, subject)
        }
      })

      console.log('📚 Credits map created:', creditsMap)
      return creditsMap
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper function to calculate GPA using Anna University formula: GPA = Σ(Ci × GPi) / Σ(Ci)
// ALL subjects are included - failed subjects (U, AB) get 0 grade points but credits still count in denominator
export function calculateGPA(
  grades: Record<string, string>,
  subjectCredits?: Record<string, number>
): number {
  console.log('🧮 Anna University GPA Calculation:')
  console.log('Input grades:', grades)
  console.log('Subject credits map for these subjects:')
  
  // Show credits for each subject in the grades
  Object.keys(grades).forEach(subjectCode => {
    const credits = subjectCredits?.[subjectCode]
    console.log(`  ${subjectCode}: ${credits ?? 'MISSING'} credits`)
  })
  
  const subjects = Object.entries(grades)
  if (subjects.length === 0) return 0

  let totalWeightedPoints = 0 // Σ(Ci × GPi)
  let totalCredits = 0 // Σ(Ci)

  subjects.forEach(([subjectCode, grade]) => {
    const gradePoint = getGradePoint(grade)
    const credits = subjectCredits?.[subjectCode]
    
    if (typeof credits !== 'number') {
      console.warn(`⚠️ Skipping ${subjectCode} — credits missing/non-numeric in DB`)
      return
    }
    
    const weightedPoints = credits * gradePoint
    
    console.log(`📊 ${subjectCode}: Grade=${grade}, GP=${gradePoint}, Credits=${credits}, Weighted=${weightedPoints}`)
    
    totalWeightedPoints += weightedPoints
    totalCredits += credits
  })

  console.log(`📈 Total Weighted Points: ${totalWeightedPoints}`)
  console.log(`📈 Total Credits: ${totalCredits}`)
  
  const gpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0
  const roundedGpa = Math.round(gpa * 100) / 100
  
  console.log(`🎯 Final GPA: ${gpa} (rounded: ${roundedGpa})`)
  
  return roundedGpa
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
