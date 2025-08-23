export interface Database {
  public: {
    Tables: {
      unified_students: {
        Row: {
          id: string
          register_number: string
          name: string | null
          email: string | null
          mobile: string | null
          class_year: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          register_number: string
          name?: string | null
          email?: string | null
          mobile?: string | null
          class_year?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          register_number?: string
          name?: string | null
          email?: string | null
          mobile?: string | null
          class_year?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      unified_student_registrations: {
        Row: {
          id: string
          student_id: string
          registration_type: 'nptel' | 'seminar' | 'both'
          registration_date: string
          is_active: boolean
        }
        Insert: {
          id?: string
          student_id: string
          registration_type: 'nptel' | 'seminar' | 'both'
          registration_date?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          student_id?: string
          registration_type?: 'nptel' | 'seminar' | 'both'
          registration_date?: string
          is_active?: boolean
        }
      }
      unified_nptel_enrollments: {
        Row: {
          id: string
          student_id: string
          course_name: string
          course_id: string
          course_duration: number
          enrollment_date: string
          is_active: boolean
        }
        Insert: {
          id?: string
          student_id: string
          course_name: string
          course_id: string
          course_duration?: number
          enrollment_date?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          student_id?: string
          course_name?: string
          course_id?: string
          course_duration?: number
          enrollment_date?: string
          is_active?: boolean
        }
      }
      unified_nptel_progress: {
        Row: {
          id: string
          enrollment_id: string
          week_number: number
          status: 'not_started' | 'in_progress' | 'completed'
          updated_at: string
        }
        Insert: {
          id?: string
          enrollment_id: string
          week_number: number
          status?: 'not_started' | 'in_progress' | 'completed'
          updated_at?: string
        }
        Update: {
          id?: string
          enrollment_id?: string
          week_number?: number
          status?: 'not_started' | 'in_progress' | 'completed'
          updated_at?: string
        }
      }
      unified_seminar_bookings: {
        Row: {
          id: string
          student_id: string
          booking_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          booking_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          booking_date?: string
          created_at?: string
        }
      }
      unified_seminar_selections: {
        Row: {
          id: string
          student_id: string
          seminar_date: string
          selected_at: string
        }
        Insert: {
          id?: string
          student_id: string
          seminar_date: string
          selected_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          seminar_date?: string
          selected_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          file_url: string
          file_name: string
          marks: number | null
          status: 'submitted' | 'graded'
          submitted_at: string
          graded_at: string | null
          feedback: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          file_url: string
          file_name: string
          marks?: number | null
          status?: 'submitted' | 'graded'
          submitted_at?: string
          graded_at?: string | null
          feedback?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          file_url?: string
          file_name?: string
          marks?: number | null
          status?: 'submitted' | 'graded'
          submitted_at?: string
          graded_at?: string | null
          feedback?: string | null
        }
      }
      // Legacy NPTEL tables from original project
      ii_it_students: {
        Row: {
          id: string
          register_number: string
          student_name: string
          email: string
          mobile: string
          class_name: string
          nptel_course_name: string
          nptel_course_id: string
          course_duration: string
          week_1_status: string
          week_2_status: string
          week_3_status: string
          week_4_status: string
          week_5_status: string
          week_6_status: string
          week_7_status: string
          week_8_status: string
          week_9_status: string
          week_10_status: string
          week_11_status: string
          week_12_status: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          register_number: string
          student_name: string
          email: string
          mobile: string
          class_name: string
          nptel_course_name: string
          nptel_course_id: string
          course_duration: string
          week_1_status?: string
          week_2_status?: string
          week_3_status?: string
          week_4_status?: string
          week_5_status?: string
          week_6_status?: string
          week_7_status?: string
          week_8_status?: string
          week_9_status?: string
          week_10_status?: string
          week_11_status?: string
          week_12_status?: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          register_number?: string
          student_name?: string
          email?: string
          mobile?: string
          class_name?: string
          nptel_course_name?: string
          nptel_course_id?: string
          course_duration?: string
          week_1_status?: string
          week_2_status?: string
          week_3_status?: string
          week_4_status?: string
          week_5_status?: string
          week_6_status?: string
          week_7_status?: string
          week_8_status?: string
          week_9_status?: string
          week_10_status?: string
          week_11_status?: string
          week_12_status?: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at?: string
        }
      }
      iii_it_students: {
        Row: {
          id: string
          register_number: string
          student_name: string
          email: string
          mobile: string
          class_name: string
          nptel_course_name: string
          nptel_course_id: string
          course_duration: string
          week_1_status: string
          week_2_status: string
          week_3_status: string
          week_4_status: string
          week_5_status: string
          week_6_status: string
          week_7_status: string
          week_8_status: string
          week_9_status: string
          week_10_status: string
          week_11_status: string
          week_12_status: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          register_number: string
          student_name: string
          email: string
          mobile: string
          class_name: string
          nptel_course_name: string
          nptel_course_id: string
          course_duration: string
          week_1_status?: string
          week_2_status?: string
          week_3_status?: string
          week_4_status?: string
          week_5_status?: string
          week_6_status?: string
          week_7_status?: string
          week_8_status?: string
          week_9_status?: string
          week_10_status?: string
          week_11_status?: string
          week_12_status?: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          register_number?: string
          student_name?: string
          email?: string
          mobile?: string
          class_name?: string
          nptel_course_name?: string
          nptel_course_id?: string
          course_duration?: string
          week_1_status?: string
          week_2_status?: string
          week_3_status?: string
          week_4_status?: string
          week_5_status?: string
          week_6_status?: string
          week_7_status?: string
          week_8_status?: string
          week_9_status?: string
          week_10_status?: string
          week_11_status?: string
          week_12_status?: string
          week_1_updated_at?: string
          week_2_updated_at?: string
          week_3_updated_at?: string
          week_4_updated_at?: string
          week_5_updated_at?: string
          week_6_updated_at?: string
          week_7_updated_at?: string
          week_8_updated_at?: string
          week_9_updated_at?: string
          week_10_updated_at?: string
          week_11_updated_at?: string
          week_12_updated_at?: string
          created_at?: string
        }
      }
      // Legacy seminar tables from original project
      seminar_students: {
        Row: {
          id: string
          reg_number: string
          created_at: string
        }
        Insert: {
          id?: string
          reg_number: string
          created_at?: string
        }
        Update: {
          id?: string
          reg_number?: string
          created_at?: string
        }
      }
      seminar_bookings: {
        Row: {
          id: string
          student_id: string
          booking_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          booking_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          booking_date?: string
          created_at?: string
        }
      }
      seminar_selections: {
        Row: {
          id: string
          student_id: string
          seminar_date: string
          selected_at: string
        }
        Insert: {
          id?: string
          student_id: string
          seminar_date: string
          selected_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          seminar_date?: string
          selected_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier use
export type Student = Database['public']['Tables']['unified_students']['Row']
export type StudentInsert = Database['public']['Tables']['unified_students']['Insert']
export type StudentUpdate = Database['public']['Tables']['unified_students']['Update']

export type StudentRegistration = Database['public']['Tables']['unified_student_registrations']['Row']
export type StudentRegistrationInsert = Database['public']['Tables']['unified_student_registrations']['Insert']
export type StudentRegistrationUpdate = Database['public']['Tables']['unified_student_registrations']['Update']

export type NPTELEnrollment = Database['public']['Tables']['unified_nptel_enrollments']['Row']
export type NPTELEnrollmentInsert = Database['public']['Tables']['unified_nptel_enrollments']['Insert']
export type NPTELEnrollmentUpdate = Database['public']['Tables']['unified_nptel_enrollments']['Update']

export type NPTELProgress = Database['public']['Tables']['unified_nptel_progress']['Row']
export type NPTELProgressInsert = Database['public']['Tables']['unified_nptel_progress']['Insert']
export type NPTELProgressUpdate = Database['public']['Tables']['unified_nptel_progress']['Update']

export type SeminarBooking = Database['public']['Tables']['unified_seminar_bookings']['Row']
export type SeminarBookingInsert = Database['public']['Tables']['unified_seminar_bookings']['Insert'] & {
  seminar_topic?: string | null
}
export type SeminarBookingUpdate = Database['public']['Tables']['unified_seminar_bookings']['Update'] & {
  seminar_topic?: string | null
}

export type SeminarSelection = Database['public']['Tables']['unified_seminar_selections']['Row']
export type SeminarSelectionInsert = Database['public']['Tables']['unified_seminar_selections']['Insert']
export type SeminarSelectionUpdate = Database['public']['Tables']['unified_seminar_selections']['Update']

// Extended types with joined data
export interface StudentWithRegistrations extends Student {
  unified_student_registrations: StudentRegistration[]
}

export interface NPTELEnrollmentWithProgress extends NPTELEnrollment {
  unified_nptel_progress: NPTELProgress[]
  unified_students: Student
}

export interface SeminarBookingWithStudent extends SeminarBooking {
  students: Student
}

export interface SeminarSelectionWithStudent extends SeminarSelection {
  students: Student
}

// Application-specific types
export interface AuthState {
  user: Student | null
  loading: boolean
  registrations: StudentRegistration[]
}

export interface BookingWindowInfo {
  isOpen: boolean
  timeUntilOpen?: number
  timeUntilClose?: number
  nextOpenTime?: Date
}

export interface TodaySelection {
  student: Student
  selectedAt: string
}

export interface NPTELWeekStatus {
  week: number
  status: 'not_started' | 'in_progress' | 'completed'
  updatedAt?: string
  isLocked: boolean
  unlockTime?: Date
}

export interface DashboardData {
  student: Student
  nptelEnrollments: NPTELEnrollmentWithProgress[]
  seminarBookings: SeminarBooking[]
  upcomingSelections: SeminarSelection[]
}