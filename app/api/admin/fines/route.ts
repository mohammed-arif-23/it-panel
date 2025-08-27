import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { holidayService } from '../../../../lib/holidayService';
import { fineService } from '../../../../lib/fineService';

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  return adminSession?.value === 'authenticated';
}

// Calculate fine amount for the new simple system: fixed amount per day
async function calculateFineAmount(baseAmount: number, dailyIncrement: number, referenceDate: string): Promise<number> {
  // New system: Just return the base amount (₹10 per day)
  return baseAmount;
}

// For compatibility, keep this function but it's not used in new system
async function calculateWorkingDaysOverdue(referenceDate: string): Promise<number> {
  return 1; // Always 1 day in the new system
}

// GET - Fetch fines with filters
export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const classYear = searchParams.get('class') || 'all';
    const status = searchParams.get('status') || 'all';
    const fineType = searchParams.get('type') || 'all';
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    // Build query for fines with student details
    let finesQuery = (supabase as any)
      .from('unified_student_fines')
      .select(`
        *,
        unified_students!inner(
          id,
          register_number,
          name,
          email,
          class_year
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (classYear !== 'all') {
      finesQuery = finesQuery.eq('unified_students.class_year', classYear);
    }

    if (status !== 'all') {
      finesQuery = finesQuery.eq('payment_status', status);
    }

    if (fineType !== 'all') {
      finesQuery = finesQuery.eq('fine_type', fineType);
    }

    if (dateFrom) {
      finesQuery = finesQuery.gte('reference_date', dateFrom);
    }

    if (dateTo) {
      finesQuery = finesQuery.lte('reference_date', dateTo);
    }

    const { data: fines, error: finesError } = await finesQuery;

    if (finesError) {
      console.error('Error fetching fines:', finesError);
      return NextResponse.json(
        { error: 'Failed to fetch fines', details: finesError.message },
        { status: 500 }
      );
    }

    // Process fines with updated calculations (simplified system)
    const processedFines = await Promise.all((fines || []).map(async (fine: any) => {
      // In new system: fine amount is just the base_amount (₹10 per day)
      const currentAmount = fine.base_amount || 10.00;

      return {
        ...fine,
        actual_days_overdue: 1, // Always 1 day in new system
        current_total_amount: currentAmount,
        needs_update: false // No updates needed in simplified system
      };
    }));

    // Calculate summary statistics
    const summary = {
      total_fines: processedFines.length,
      pending_fines: processedFines.filter((f: any) => f.payment_status === 'pending').length,
      paid_fines: processedFines.filter((f: any) => f.payment_status === 'paid').length,
      waived_fines: processedFines.filter((f: any) => f.payment_status === 'waived').length,
      total_amount: processedFines.reduce((sum: number, f: any) => sum + f.current_total_amount, 0),
      pending_amount: processedFines.filter((f: any) => f.payment_status === 'pending').reduce((sum: number, f: any) => sum + f.current_total_amount, 0),
      collected_amount: processedFines.filter((f: any) => f.payment_status === 'paid').reduce((sum: number, f: any) => sum + (f.paid_amount || 0), 0),
      by_type: {
        seminar_no_booking: processedFines.filter((f: any) => f.fine_type === 'seminar_no_booking').length,
        assignment_late: processedFines.filter((f: any) => f.fine_type === 'assignment_late').length,
        attendance_absent: processedFines.filter((f: any) => f.fine_type === 'attendance_absent').length
      },
      by_class: {
        'II-IT': processedFines.filter((f: any) => f.unified_students?.class_year === 'II-IT').length,
        'III-IT': processedFines.filter((f: any) => f.unified_students?.class_year === 'III-IT').length
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        fines: processedFines,
        summary
      },
      filters: { classYear, status, fineType, dateFrom, dateTo },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fines fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new fines or update existing ones
export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_fine':
        return await createFine(data);
      case 'update_fine':
        return await updateFine(data);
      case 'bulk_create':
        return await bulkCreateFines(data);
      case 'auto_calculate':
        return await autoCalculateOverdueFines();
      case 'create_manual_fine':
        return await createManualFine(data);
      case 'update_status':
        return await updateFineStatus(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Fines operation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Create a new fine (simplified system)
async function createFine(data: any) {
  const {
    studentId,
    fineType,
    referenceId,
    referenceDate,
    baseAmount = 10.00, // Fixed ₹10 per day
    dailyIncrement = 0.00, // No increments in new system
    reason
  } = data;

  if (!studentId || !fineType || !referenceDate) {
    return NextResponse.json(
      { error: 'Missing required fields: studentId, fineType, referenceDate' },
      { status: 400 }
    );
  }

  // Check if fine already exists for this reference
  if (referenceId) {
    const { data: existingFine } = await (supabase as any)
      .from('unified_student_fines')
      .select('id')
      .eq('student_id', studentId)
      .eq('reference_id', referenceId)
      .eq('fine_type', fineType)
      .single();

    if (existingFine) {
      return NextResponse.json(
        { error: 'Fine already exists for this reference' },
        { status: 409 }
      );
    }
  }

  const { data: fine, error } = await (supabase as any)
    .from('unified_student_fines')
    .insert({
      student_id: studentId,
      fine_type: fineType,
      reference_id: referenceId,
      reference_date: referenceDate,
      base_amount: baseAmount,
      daily_increment: dailyIncrement,
      days_overdue: 1, // Always 1 day in new system
      payment_status: 'pending'
    })
    .select(`
      *,
      unified_students(id, register_number, name, class_year)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: fine,
    message: 'Fine created successfully'
  });
}

// Update an existing fine
async function updateFine(data: any) {
  const {
    fineId,
    paymentStatus,
    paidAmount,
    waivedBy,
    waivedReason,
    notes
  } = data;

  if (!fineId) {
    return NextResponse.json({ error: 'Fine ID is required' }, { status: 400 });
  }

  const updateData: any = {};

  if (paymentStatus) {
    updateData.payment_status = paymentStatus;
    
    if (paymentStatus === 'paid' && paidAmount !== undefined) {
      updateData.paid_amount = paidAmount;
      updateData.paid_at = new Date().toISOString();
    }
    
    if (paymentStatus === 'waived') {
      updateData.waived_by = waivedBy;
      updateData.waived_reason = waivedReason;
      updateData.paid_at = new Date().toISOString();
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { data: fine, error } = await (supabase as any)
    .from('unified_student_fines')
    .update(updateData)
    .eq('id', fineId)
    .select(`
      *,
      unified_students(id, register_number, name, class_year)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: fine,
    message: 'Fine updated successfully'
  });
}

// Bulk create fines for students who haven't booked seminars (simplified system)
async function bulkCreateFines(data: any) {
  const { seminarDate, excludeStudentIds = [] } = data;

  if (!seminarDate) {
    return NextResponse.json({ error: 'Seminar date is required' }, { status: 400 });
  }

  try {
    // Get all students who haven't booked for the seminar date
    const { data: allStudents, error: studentsError } = await (supabase as any)
      .from('unified_students')
      .select('id, register_number, name, class_year');

    if (studentsError) throw studentsError;

    const { data: bookings, error: bookingsError } = await (supabase as any)
      .from('unified_seminar_bookings')
      .select('student_id')
      .eq('booking_date', seminarDate);

    if (bookingsError) throw bookingsError;

    // Find students who haven't booked
    const bookedStudentIds = new Set(bookings?.map((b: any) => b.student_id) || []);
    const excludeIds = new Set(excludeStudentIds);
    
    const nonBookedStudents = (allStudents || []).filter((student: any) => 
      !bookedStudentIds.has(student.id) && !excludeIds.has(student.id)
    );

    // Create fines for non-booked students
    const results = [];
    const errors = [];

    for (const student of nonBookedStudents) {
      try {
        // Check if fine already exists
        const { data: existingFine } = await (supabase as any)
          .from('unified_student_fines')
          .select('id')
          .eq('student_id', (student as any).id)
          .eq('fine_type', 'seminar_no_booking')
          .eq('reference_date', seminarDate)
          .single();

        if (!existingFine) {
          const { data: fine, error } = await (supabase as any)
            .from('unified_student_fines')
            .insert({
              student_id: (student as any).id,
              fine_type: 'seminar_no_booking',
              reference_date: seminarDate,
              base_amount: 10.00, // Fixed ₹10 per day
              daily_increment: 0.00, // No increments
              days_overdue: 1, // Always 1 day
              payment_status: 'pending'
            })
            .select()
            .single();

          if (error) throw error;
          results.push({ studentId: (student as any).id, fineId: (fine as any).id, action: 'created' });
        } else {
          results.push({ studentId: (student as any).id, fineId: (existingFine as any).id, action: 'existing' });
        }
      } catch (error) {
        errors.push({ 
          studentId: (student as any).id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        created: results.filter(r => r.action === 'created').length,
        existing: results.filter(r => r.action === 'existing').length,
        errorCount: errors.length,
        results,
        errorDetails: errors
      },
      message: `Processed ${results.length} students, created ${results.filter(r => r.action === 'created').length} new ₹10 daily fines`
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Bulk fine creation failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Auto-calculate and update overdue fines (not needed in simplified system)
async function autoCalculateOverdueFines() {
  // In the new simplified system, fines are fixed at ₹10 per day
  // No calculation or updates needed
  return NextResponse.json({
    success: true,
    data: {
      updated: 0,
      errorCount: 0,
      results: [],
      errorDetails: []
    },
    message: 'No updates needed - using simplified fixed daily fines (₹10 per day)'
  });
}

// DELETE - Delete a fine
export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fineId = searchParams.get('id');

    if (!fineId) {
      return NextResponse.json({ error: 'Fine ID is required' }, { status: 400 });
    }

    const result = await fineService.deleteFine(fineId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Fine deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Create manual fine using fine service
async function createManualFine(data: any) {
  const {
    student_id,
    fine_type,
    reference_date,
    amount = 10, // Fixed ₹10 per day
    description
  } = data;

  if (!student_id || !fine_type || !reference_date) {
    return NextResponse.json(
      { error: 'Missing required fields: student_id, fine_type, reference_date' },
      { status: 400 }
    );
  }

  const result = await fineService.createManualFine({
    student_id,
    fine_type,
    reference_date,
    amount,
    payment_status: 'pending',
    description
  });

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.fine,
    message: result.message
  });
}

// Update fine status using fine service
async function updateFineStatus(data: any) {
  const { fineId, status, notes } = data;

  if (!fineId || !status) {
    return NextResponse.json(
      { error: 'Missing required fields: fineId, status' },
      { status: 400 }
    );
  }

  const result = await fineService.updateFineStatus(fineId, status, notes);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: result.message
  });
}