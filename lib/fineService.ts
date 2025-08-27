import { supabase } from './supabase';
import { holidayService } from './holidayService';

export interface FineRecord {
  id?: string;
  student_id: string;
  fine_type: 'seminar_no_booking' | 'assignment_late' | 'attendance_absent' | 'other';
  reference_date: string;
  amount: number; // Fixed amount per day (₹10 for no booking)
  payment_status: 'pending' | 'paid' | 'waived';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export class FineService {
  private static instance: FineService;

  static getInstance(): FineService {
    if (!FineService.instance) {
      FineService.instance = new FineService();
    }
    return FineService.instance;
  }

  /**
   * Check if a date is a valid working day (not weekend or holiday)
   */
  private async isWorkingDay(date: string): Promise<boolean> {
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // Skip weekends (Sunday = 0, Saturday = 6)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Check if this date is a holiday
    const { isHoliday } = await holidayService.isHoliday(date);
    return !isHoliday;
  }

  /**
   * Create fines for students who didn't book seminars on a specific date
   * Simple logic: Each day not booked = ₹10 fine for that specific day
   */
  async createFinesForNonBookedStudents(seminarDate: string): Promise<{
    success: boolean;
    message: string;
    finesCreated: number;
    errors: string[];
  }> {
    try {
      console.log('Creating daily fines for non-booked students for date:', seminarDate);

      // Check if this is a working day (no fines on weekends/holidays)
      const isWorking = await this.isWorkingDay(seminarDate);
      if (!isWorking) {
        return {
          success: true,
          message: `No fines created - ${seminarDate} is not a working day`,
          finesCreated: 0,
          errors: []
        };
      }

      // Get all students
      const { data: allStudents, error: studentsError } = await (supabase as any)
        .from('unified_students')
        .select('id, register_number, name, class_year');

      if (studentsError) {
        console.error('Error fetching all students:', studentsError);
        return {
          success: false,
          message: 'Failed to fetch all students',
          finesCreated: 0,
          errors: [studentsError.message]
        };
      }

      // Get students who booked for this specific date
      const { data: bookings, error: bookingsError } = await (supabase as any)
        .from('unified_seminar_bookings')
        .select('student_id')
        .eq('booking_date', seminarDate);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return {
          success: false,
          message: 'Failed to fetch bookings',
          finesCreated: 0,
          errors: [bookingsError.message]
        };
      }

      // Find students who didn't book on this specific date
      const bookedStudentIds = new Set(bookings?.map((b: any) => b.student_id) || []);
      const nonBookedStudents = (allStudents || []).filter((student: any) => 
        !bookedStudentIds.has(student.id)
      );

      console.log(`Found ${nonBookedStudents.length} students who didn't book for ${seminarDate}`);

      if (nonBookedStudents.length === 0) {
        return {
          success: true,
          message: 'All students booked for this date',
          finesCreated: 0,
          errors: []
        };
      }

      // Check if fines already exist for this specific date
      const { data: existingFines, error: fineCheckError } = await (supabase as any)
        .from('unified_student_fines')
        .select('student_id')
        .eq('reference_date', seminarDate)
        .eq('fine_type', 'seminar_no_booking');

      if (fineCheckError) {
        console.error('Error checking existing fines:', fineCheckError);
      }

      const existingFineStudentIds = new Set(
        (existingFines || []).map((fine: any) => fine.student_id)
      );

      // Filter out students who already have fines for this date
      const studentsToFine = nonBookedStudents.filter(
        (student: any) => !existingFineStudentIds.has(student.id)
      );

      if (studentsToFine.length === 0) {
        return {
          success: true,
          message: 'Fines already exist for all non-booked students on this date',
          finesCreated: 0,
          errors: []
        };
      }

      // Create simple daily fines: ₹10 per day not booked
      const results = [];
      const errors = [];
      
      for (const student of studentsToFine) {
        try {
          const { data: fine, error } = await (supabase as any)
            .from('unified_student_fines')
            .insert({
              student_id: student.id,
              fine_type: 'seminar_no_booking',
              reference_date: seminarDate,
              base_amount: 10.00, // Fixed ₹10 per day
              daily_increment: 0.00, // No increments
              days_overdue: 1, // Always 1 day for the specific date
              payment_status: 'pending'
            })
            .select()
            .single();

          if (error) {
            throw error;
          }
          
          results.push({ studentId: student.id, fineId: fine.id, action: 'created' });
        } catch (error) {
          errors.push({ 
            studentId: student.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      console.log(`Successfully created ${results.length} daily fines for non-booked students`);

      return {
        success: true,
        message: `Created ₹10 fine for ${results.length} students who didn't book on ${seminarDate}`,
        finesCreated: results.length,
        errors: errors.map(e => `Student ${e.studentId}: ${e.error}`)
      };

    } catch (error) {
      console.error('Error in createFinesForNonBookedStudents:', error);
      return {
        success: false,
        message: 'Internal error while creating fines',
        finesCreated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create a manual fine (admin function)
   */
  async createManualFine(fine: Omit<FineRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    message: string;
    fine?: FineRecord;
  }> {
    try {
      // Convert to database format
      const dbFine = {
        student_id: fine.student_id,
        fine_type: fine.fine_type,
        reference_date: fine.reference_date,
        base_amount: fine.amount, // Use the fixed amount
        daily_increment: 0.00, // No increments in new system
        days_overdue: 1, // Always 1 for daily fines
        payment_status: fine.payment_status
      };

      const { data, error } = await (supabase as any)
        .from('unified_student_fines')
        .insert([dbFine])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Failed to create fine: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Fine created successfully',
        fine: {
          ...fine,
          id: data.id,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error creating fine: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update fine payment status (admin function)
   */
  async updateFineStatus(fineId: string, status: 'pending' | 'paid' | 'waived', notes?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.description = notes;
      }

      const { error } = await (supabase as any)
        .from('unified_student_fines')
        .update(updateData)
        .eq('id', fineId);

      if (error) {
        return {
          success: false,
          message: `Failed to update fine: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Fine status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error updating fine: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a fine (admin function)
   */
  async deleteFine(fineId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await supabase
        .from('unified_student_fines')
        .delete()
        .eq('id', fineId);

      if (error) {
        return {
          success: false,
          message: `Failed to delete fine: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Fine deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error deleting fine: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get student fines with calculated amounts
   */
  async getStudentFines(studentId: string): Promise<{
    success: boolean;
    fines: Array<FineRecord & { currentAmount: number; workingDaysOverdue: number }>;
    totalAmount: number;
  }> {
    try {
      const { data: fines, error } = await (supabase as any)
        .from('unified_student_fines')
        .select('*')
        .eq('student_id', studentId)
        .eq('payment_status', 'pending');

      if (error) {
        return {
          success: false,
          fines: [],
          totalAmount: 0
        };
      }

      const finesWithAmounts = await Promise.all(
        (fines || []).map(async (fine: any) => {
          // In new simplified system: fixed amount per day
          const currentAmount = fine.base_amount || 10.00;
          return {
            ...fine,
            workingDaysOverdue: 1, // Always 1 day in new system
            currentAmount
          };
        })
      );

      const totalAmount = finesWithAmounts.reduce((sum: number, fine: any) => sum + fine.currentAmount, 0);

      return {
        success: true,
        fines: finesWithAmounts,
        totalAmount
      };
    } catch (error) {
      return {
        success: false,
        fines: [],
        totalAmount: 0
      };
    }
  }

  /**
   * Get all fines for admin dashboard
   */
  async getAllFines(filters?: {
    class?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
  }): Promise<{
    success: boolean;
    fines: Array<FineRecord & { 
      student_name: string; 
      register_number: string; 
      class_year: string;
      currentAmount: number;
      workingDaysOverdue: number;
    }>;
  }> {
    try {
      let query = (supabase as any)
        .from('unified_student_fines')
        .select(`
          *,
          unified_students(name, register_number, class_year)
        `);

      // Apply filters
      if (filters?.class && filters.class !== 'all') {
        // We'll need to filter by class in the application layer since it's a joined field
      }
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('payment_status', filters.status);
      }
      
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('fine_type', filters.type);
      }
      
      if (filters?.from) {
        query = query.gte('reference_date', filters.from);
      }
      
      if (filters?.to) {
        query = query.lte('reference_date', filters.to);
      }

      const { data: fines, error } = await query;

      if (error) {
        return {
          success: false,
          fines: []
        };
      }

      let filteredFines = fines || [];
      
      // Filter by class if specified
      if (filters?.class && filters.class !== 'all') {
        filteredFines = filteredFines.filter((fine: any) => 
          (fine.unified_students as any)?.class_year === filters.class
        );
      }

      const finesWithAmounts = await Promise.all(
        filteredFines.map(async (fine: any) => {
          // In new simplified system: fixed amount per day
          const currentAmount = fine.base_amount || 10.00;
          const student = fine.unified_students as any;
          
          return {
            ...fine,
            student_name: student?.name || 'Unknown',
            register_number: student?.register_number || 'Unknown',
            class_year: student?.class_year || 'Unknown',
            workingDaysOverdue: 1, // Always 1 day in new system
            currentAmount
          };
        })
      );

      return {
        success: true,
        fines: finesWithAmounts
      };
    } catch (error) {
      return {
        success: false,
        fines: []
      };
    }
  }
}

export const fineService = FineService.getInstance();