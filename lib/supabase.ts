import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Helper functions for database operations
export const dbHelpers = {
  // ===========================
  // STUDENT OPERATIONS
  // ===========================
  async findStudentByRegNumber(regNumber: string) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('unified_seminar_bookings')
      .select(`
        *,
        unified_students (*)
      `)
      .eq('booking_date', date)
    
    return { data, error }
  },

  async getStudentSeminarBooking(studentId: string, date: string) {
    const { data, error } = await supabase
      .from('unified_seminar_bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_date', date)
      .single()
    
    return { data, error }
  },

  async deleteSeminarBooking(studentId: string, date: string) {
    const { error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false })
    
    return { data, error }
  }
}