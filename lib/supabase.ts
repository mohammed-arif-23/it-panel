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
      .select('*')
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
    password?: string
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
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all students who have seminar registrations but haven't booked for today
      const { data: students, error } = await supabaseAdmin
        .from('unified_students')
        .select(`
          id,
          register_number,
          name,
          email,
          class_year,
          unified_student_registrations(registration_type)
        `)
        .eq('unified_student_registrations.registration_type', 'seminar')
        .eq('unified_student_registrations.is_active', true);
      
      if (error) {
        return { data: null, error };
      }
      
      // Filter out students who have already booked for today
      const studentsWithBookings = await Promise.all(
        (students || []).map(async (student: any) => {
          const { data: booking } = await supabaseAdmin
            .from('unified_seminar_bookings')
            .select('id')
            .eq('student_id', student.id)
            .eq('booking_date', today)
            .single();
          
          return {
            student,
            hasBooking: !!booking
          };
        })
      );
      
      // Return students who don't have bookings for today
      const studentsNotBooked = studentsWithBookings
        .filter(({ hasBooking }) => !hasBooking)
        .map(({ student }) => student);
      
      return { data: studentsNotBooked, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // Add the missing addFineForNotBooking method
  addFineForNotBooking: async (studentId: string) => {
    try {
      // Check if student already has a fine for not booking today
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if the student already has a fine for today
      const { data: existingFines, error: checkError } = await supabaseAdmin
        .from('unified_student_fines')
        .select('id')
        .eq('student_id', studentId)
        .eq('fine_type', 'seminar_not_booked')
        .eq('reference_date', today);
      
      if (checkError) {
        return { data: null, error: checkError };
      }
      
      // If fine already exists, return it
      if (existingFines && existingFines.length > 0) {
        return { data: existingFines[0], error: null };
      }
      
      // Create a new fine for not booking
      const { data, error } = await supabaseAdmin
        .from('unified_student_fines')
        .insert({
          student_id: studentId,
          fine_type: 'seminar_not_booked',
          reference_date: today,
          reference_id: `not_booked_${today}`,
          base_amount: 10.00, // Default fine amount
          daily_increment: 5.00, // Increment per day
          days_overdue: 0
        } as any)
        .select()
        .single();
      
      // Also update the student's total fine amount
      const { data: student, error: studentError } = await supabaseAdmin
        .from('unified_students')
        .select('total_fine_amount')
        .eq('id', studentId)
        .single();
      
      if (!studentError && student) {
        await (supabaseAdmin as any)
          .from('unified_students')
          .update({
            total_fine_amount: ((student as any).total_fine_amount || 0) + 10.00,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentId);
      }
      
      return { data, error };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // ===========================
  // NO DUE OPERATIONS
  // ===========================
  async findStudentById(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_students')
      .select('*')
      .eq('id', studentId)
      .single()
    
    return { data, error }
  },

  async getNoDueData(studentId: string) {
    const [student, marks, subjects, assignments] = await Promise.all([
      this.findStudentById(studentId),
      this.getStudentMarks(studentId),
      this.getStudentSubjects(studentId),
      this.getStudentAssignments(studentId)
    ])
    
    return { student, marks, subjects, assignments }
  },
  
  async getStudentMarks(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('unified_marks')
      .select('*')
      .eq('student_id', studentId)
    
    return { data, error }
  },
  
  async getStudentSubjects(studentId: string) {
    // Get student's semester first
    const { data: student } = await this.findStudentById(studentId)
    const studentData = student as any
    if (!studentData || !studentData.semester) return { data: null, error: 'Student not found or semester not set' }
    
    const { data, error } = await (supabaseAdmin as any)
      .from('subjects')
      .select('*')
      .eq('semester', studentData.semester)
      .eq('department', 'IT')
      .in('course_type', ['THEORY', 'ELECTIVE'])
    
    return { data, error }
  },

  async getStudentAssignments(studentId: string) {
    // Get student's class_year first
    const { data: student } = await this.findStudentById(studentId)
    const studentData = student as any
    if (!studentData || !studentData.class_year) return { data: null, error: 'Student not found or class_year not set' }
    
    // Get all assignments for the student's class
    const { data: assignments, error: assignmentsError } = await (supabaseAdmin as any)
      .from('assignments')
      .select('id, sub_code, class_year')
      .eq('class_year', studentData.class_year)
    
    if (assignmentsError || !assignments) {
      return { data: null, error: assignmentsError }
    }
    
    // Get submission status for each assignment
    const assignmentData: { [key: string]: { total: number, submitted: number } } = {}
    
    for (const assignment of assignments) {
      const subCode = (assignment as any).sub_code
      if (!subCode) continue
      
      if (!assignmentData[subCode]) {
        assignmentData[subCode] = { total: 0, submitted: 0 }
      }
      
      assignmentData[subCode].total++
      
      // Check if student submitted this assignment
      const { data: submission } = await (supabaseAdmin as any)
        .from('assignment_submissions')
        .select('id, status')
        .eq('assignment_id', (assignment as any).id)
        .eq('student_id', studentId)
        .in('status', ['submitted', 'graded'])
        .maybeSingle()
      
      if (submission) {
        assignmentData[subCode].submitted++
      }
    }
    
    return { data: assignmentData, error: null }
  },
  
  async saveNoDueHistory(record: {
    student_id: string
    register_number: string
    student_name: string
    class_year: string
    semester: number
    year: number
    marks_snapshot: any
    pdf_url?: string
  }) {
    const { data, error } = await (supabaseAdmin as any)
      .from('nodue_history')
      .insert(record)
      .select()
      .single()
    
    return { data, error }
  },
  
  async getNoDueHistory(filters: {
    studentId?: string
    registerNumber?: string
    classYear?: string
    semester?: number
    startDate?: string
    endDate?: string
  }) {
    let query = supabaseAdmin
      .from('nodue_history')
      .select('*')
    
    if (filters.studentId) query = query.eq('student_id', filters.studentId)
    if (filters.registerNumber) query = query.ilike('register_number', `%${filters.registerNumber}%`)
    if (filters.classYear) query = query.eq('class_year', filters.classYear)
    if (filters.semester) query = query.eq('semester', filters.semester)
    if (filters.startDate) query = query.gte('generated_at', filters.startDate)
    if (filters.endDate) query = query.lte('generated_at', filters.endDate)
    
    const { data, error } = await query.order('generated_at', { ascending: false })
    
    return { data, error }
  }
}