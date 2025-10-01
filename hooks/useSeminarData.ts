import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { holidayService } from '../lib/holidayService'
import { seminarTimingService } from '../lib/seminarTimingService'

interface TodaySelection {
  student: {
    id: string
    register_number: string
    name: string
    class_year?: string
  }
  selectedAt: string
}

interface TomorrowSelection {
  student: {
    id: string
    register_number: string
    name: string
    class_year?: string
  }
  selectedAt: string
  seminarDate: string
}

interface SeminarStudent {
  id: string
  register_number: string
  created_at?: string
}

interface BookingWindowInfo {
  isOpen: boolean
  timeUntilOpen?: number
  timeUntilClose?: number
  timeUntilSelection?: number
  nextOpenTime?: Date
  selectionTime?: Date
}

interface HolidayInfo {
  isHoliday: boolean
  holidayName?: string
  holidayDate?: string
  rescheduledDate?: string
}

const seminarDbHelpers = {
  async findSeminarStudentByRegNumber(regNumber: string) {
    const { data, error } = await supabase
      .from('unified_students')
      .select('*')
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async createSeminarStudent(regNumber: string) {
    const { data, error } = await supabase
      .from('unified_students')
      .select('*')
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async getStudentBooking(studentId: string, bookingDate: string) {
    const { data, error } = await supabase
      .from('unified_seminar_bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_date', bookingDate)
      .single()
    
    return { data, error }
  },

  async createBooking(studentId: string, bookingDate: string, seminarTopic?: string) {
    const { data, error } = await (supabase as any)
      .from('unified_seminar_bookings')
      .insert([{ 
        student_id: studentId, 
        booking_date: bookingDate,
        seminar_topic: seminarTopic || null
      }])
      .select()
      .single()
    
    return { data, error }
  },

  async getSelectionsForDate(seminarDate: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('seminar_date', seminarDate)
    
    return { data, error }
  },

  async getAllSelectionsForStudent(studentId: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false })
    
    return { data, error }
  },
}

export function useSeminarStudent(registerNumber: string) {
  return useQuery<SeminarStudent>({
    queryKey: ['seminar-student', registerNumber],
    queryFn: async () => {
      let { data: student, error } = await seminarDbHelpers.findSeminarStudentByRegNumber(registerNumber)

      if (error && error.code !== 'PGRST116') {
        throw new Error('Database error')
      }

      if (!student) {
        const createResult = await seminarDbHelpers.createSeminarStudent(registerNumber)
        if (createResult.error) {
          throw new Error('Error creating seminar student')
        }
        student = createResult.data
      }

      // Ensure we always return a SeminarStudent shape
      if (!student) {
        throw new Error('Seminar student not found')
      }
      return {
        id: (student as any).id,
        register_number: (student as any).register_number,
        created_at: (student as any).created_at,
      } as SeminarStudent
    },
    enabled: !!registerNumber,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

interface SeminarDashboardData {
  hasBookedToday: boolean
  todaySelection: TodaySelection | null
  tomorrowSelections: TomorrowSelection[]
  nextSeminarDate: string
}

export function useSeminarDashboardData(studentId: string, classYear: string) {
  return useQuery<SeminarDashboardData>({
    queryKey: ['seminar-dashboard', studentId],
    queryFn: async () => {
      const holidayAwareDate = await holidayService.getHolidayAwareNextSeminarDate()
      
      // Check if user has booked for next seminar
      const { data: booking } = await seminarDbHelpers.getStudentBooking(studentId, holidayAwareDate)
      const hasBookedToday = !!booking

      // Get date references for selection lookup
      const today = seminarTimingService.getTodayDate()
      const tomorrow = seminarTimingService.getNextSeminarDate()

      // Get TODAY's seminar selections
      const { data: todaySelections } = await seminarDbHelpers.getSelectionsForDate(today)
      
      // Process today's selection
      let todaySelection = null
      if (todaySelections && todaySelections.length > 0) {
        const userClassSelections = todaySelections.filter((selection: any) => 
          (selection as any).unified_students.class_year === classYear
        )
        
        if (userClassSelections.length > 0) {
          const sortedSelections = userClassSelections.sort((a: any, b: any) => 
            new Date((b as any).selected_at).getTime() - new Date((a as any).selected_at).getTime()
          )
          
          const latestSelection = sortedSelections[0]
          
          todaySelection = {
            student: {
              id: (latestSelection as any).unified_students.id,
              register_number: (latestSelection as any).unified_students.register_number,
              name: (latestSelection as any).unified_students.name || (latestSelection as any).unified_students.register_number,
              class_year: (latestSelection as any).unified_students.class_year
            },
            selectedAt: (latestSelection as any).selected_at
          }
        }
      }

      // Get TOMORROW's seminar selections
      const { data: tomorrowSelectionsData } = await seminarDbHelpers.getSelectionsForDate(tomorrow)
      
      let tomorrowSelections: TomorrowSelection[] = []
      if (tomorrowSelectionsData && tomorrowSelectionsData.length > 0) {
        const filteredTomorrowSelections = tomorrowSelectionsData.filter((selection: any) => 
          selection.unified_students.class_year === classYear
        )
        
        const formattedTomorrowSelections = filteredTomorrowSelections.map((selection: any) => ({
          student: {
            id: selection.unified_students.id,
            register_number: selection.unified_students.register_number,
            name: selection.unified_students.name || selection.unified_students.register_number,
            class_year: selection.unified_students.class_year
          },
          selectedAt: selection.selected_at,
          seminarDate: tomorrow
        }))
        
        const sortedTomorrowSelections = formattedTomorrowSelections.sort((a: any, b: any) => 
          new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime()
        )
        
        tomorrowSelections = sortedTomorrowSelections.slice(0, 1) as TomorrowSelection[]
      }

      return {
        hasBookedToday,
        todaySelection,
        tomorrowSelections,
        nextSeminarDate: holidayAwareDate
      } as SeminarDashboardData
    },
    enabled: !!studentId && !!classYear,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

export function usePresenterHistory(classYear: string) {
  return useQuery<TomorrowSelection[]>({
    queryKey: ['presenter-history', classYear],
    queryFn: async () => {
      const today = seminarTimingService.getTodayDate()
      
      const { data: allSelections, error } = await (supabase as any)
        .from('unified_seminar_selections')
        .select(`
          *,
          unified_students (
            id,
            name,
            register_number,
            class_year
          )
        `)
        .eq('unified_students.class_year', classYear)
        .lt('seminar_date', today)
        .order('seminar_date', { ascending: false })
        .order('selected_at', { ascending: false })

      if (error) {
        throw new Error('Error loading presenter history')
      }

      if (allSelections && allSelections.length > 0) {
        return allSelections
          .filter((selection: any) => selection.unified_students)
          .map((selection: any) => ({
            student: {
              id: selection.unified_students.id,
              register_number: selection.unified_students.register_number,
              name: selection.unified_students.name || selection.unified_students.register_number,
              class_year: selection.unified_students.class_year
            },
            selectedAt: selection.selected_at,
            seminarDate: selection.seminar_date
          }))
      }

      return []
    },
    enabled: !!classYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSeminarBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ studentId, bookingDate, seminarTopic }: {
      studentId: string
      bookingDate: string
      seminarTopic: string
    }) => {
      const { data, error } = await seminarDbHelpers.createBooking(studentId, bookingDate, seminarTopic)
      
      if (error) {
        if (error.code === '23505') {
          throw new Error(`You have already booked for the seminar on ${seminarTimingService.formatDateWithDay(bookingDate).split(',')[0]}!`)
        } else {
          throw new Error('Failed to book. Please try again.')
        }
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidate seminar dashboard data
      queryClient.invalidateQueries({ queryKey: ['seminar-dashboard'] })
    },
  })
}
