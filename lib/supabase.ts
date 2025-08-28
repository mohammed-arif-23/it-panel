import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Admin client with service role for bypassing RLS
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : supabase // Fallback to regular client if no service key

// Helper functions for database operations
export const dbHelpers = {
  // ===========================
  // STUDENT OPERATIONS
  // ===========================
  async findStudentByRegNumber(regNumber: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_students')
      .select(`
        *,
        unified_student_registrations (*)
      `)
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async createStudent(regNumber: string, name?: string, email?: string, mobile?: string, classYear?: string) {
    const { data, error } = await (supabase as any)
      .from('unified_students')
      .insert({ 
        register_number: regNumber,
        name,
        email,
        mobile,
        class_year: classYear
      })
      .select()
      .single()
    
    return { data, error }
  },

  async updateStudent(studentId: string, updates: {
    name?: string
    email?: string
    mobile?: string
    class_year?: string
  }) {
    const { data, error } = await (supabase as any)
      .from('unified_students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single()
    
    return { data, error }
  },

  // ===========================
  // REGISTRATION OPERATIONS
  // ===========================
  async createRegistration(studentId: string, registrationType: 'nptel' | 'seminar' | 'both') {
    const { data, error } = await (supabase as any)
      .from('unified_student_registrations')
      .insert({
        student_id: studentId,
        registration_type: registrationType
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getStudentRegistrations(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_student_registrations')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
    
    return { data, error }
  },

  // ===========================
  // NPTEL OPERATIONS
  // ===========================
  async createNPTELEnrollment(studentId: string, courseName: string, courseId: string, duration: number = 12) {
    const { data, error } = await (supabase as any)
      .from('unified_nptel_enrollments')
      .insert({
        student_id: studentId,
        course_name: courseName,
        course_id: courseId,
        course_duration: duration
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getNPTELEnrollments(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_nptel_enrollments')
      .select(`
        *,
        unified_nptel_progress (*)
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)
    
    return { data, error }
  },

  async updateNPTELProgress(enrollmentId: string, weekNumber: number, status: 'not_started' | 'in_progress' | 'completed') {
    const { data, error } = await (supabase as any)
      .from('unified_nptel_progress')
      .upsert({
        enrollment_id: enrollmentId,
        week_number: weekNumber,
        status,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getNPTELProgress(enrollmentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_nptel_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('week_number')
    
    return { data, error }
  },

  // ===========================
  // SEMINAR OPERATIONS
  // ===========================
  async createSeminarBooking(studentId: string, bookingDate: string) {
    const { data, error } = await (supabase as any)
      .from('unified_seminar_bookings')
      .insert({ 
        student_id: studentId, 
        booking_date: bookingDate 
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getSeminarBookingsForDate(date: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_seminar_bookings')
      .select(`
        *,
        unified_students (*)
      `)
      .eq('booking_date', date)
    
    return { data, error }
  },

  async getStudentSeminarBooking(studentId: string, date: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_seminar_bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_date', date)
      .single()
    
    return { data, error }
  },

  async deleteSeminarBooking(studentId: string, date: string) {
    const { error } = await supabaseAdmin
      .from('unified_seminar_bookings')
      .delete()
      .eq('student_id', studentId)
      .eq('booking_date', date)
    
    return { error }
  },

  // ===========================
  // SEMINAR SELECTION OPERATIONS
  // ===========================
  async createSeminarSelection(studentId: string, seminarDate: string) {
    const { data, error } = await (supabase as any)
      .from('unified_seminar_selections')
      .insert({ 
        student_id: studentId, 
        seminar_date: seminarDate 
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getSeminarSelectionForDate(date: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students (*)
      `)
      .eq('seminar_date', date)
      .single()
    
    return { data, error }
  },

  async getAllSeminarSelectionsForStudent(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_seminar_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false })
    
    return { data, error }
  },

  // Get students not booked today
  getStudentsNotBookedToday: async () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Get all students from both classes
    const { data: allStudents, error: studentsError } = await supabase
      .from('unified_students')
      .select('*')
      .in('class_year', ['II-IT', 'III-IT'])
      .order('name')
      
    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return { data: null, error: studentsError }
    }
    
    // Get students who have booked today
    const { data: bookedStudents, error: bookingError } = await supabase
      .from('unified_seminar_bookings')
      .select('student_id')
      .eq('booking_date', today)
      
    if (bookingError) {
      console.error('Error fetching bookings:', bookingError)
      return { data: null, error: bookingError }
    }
    
    // Convert booked students to a set of student IDs for efficient lookup
    const bookedStudentIds = new Set(
      bookedStudents.map(booking => (booking as any).student_id)
    )
    
    // Find students not booked today
    const studentsNotBooked = allStudents.filter(student => {
      return !bookedStudentIds.has((student as any).id)
    })
    
    return { data: studentsNotBooked, error: null }
  },

  // Add fine for not booking seminar
  addFineForNotBooking: async (studentId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const baseAmount = 10 // Base fine amount for not booking
    const dailyIncrement = 0 // Daily increment amount
    
    // Check if fine already exists for this student and date
    const { data: existingFine, error: checkError } = await supabaseAdmin
      .from('unified_student_fines')
      .select('*')
      .eq('student_id', studentId)
      .eq('fine_type', 'not_booked_seminar')
      .eq('reference_date', today)
      .single()
    
    if (existingFine) {
      return { data: existingFine, error: null }
    }
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      return { data: null, error: checkError }
    }
    
    // Create new fine
    const { data, error } = await (supabaseAdmin as any)
      .from('unified_student_fines')
      .insert({
        student_id: studentId,
        fine_type: 'not_booked_seminar',
        reference_date: today,
        base_amount: baseAmount,
        daily_increment: dailyIncrement,
        days_overdue: 0,
        payment_status: 'pending'
      })
      .select()
      .single()
    
    return { data, error }
  }
}
