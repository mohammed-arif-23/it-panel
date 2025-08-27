import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { seminarTimingService } from '../../../../lib/seminarTimingService';
import { holidayService } from '../../../../lib/holidayService';

interface BookingWithStudent {
  id: string;
  student_id: string;
  booking_date: string;
  created_at: string;
  unified_students: {
    id: string;
    register_number: string;
    name: string;
    email: string;
    class_year: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Direct cron selection started at:', new Date().toISOString());
    
    // Get next seminar date with holiday awareness
    let seminarDate = seminarTimingService.getNextSeminarDate();
    
    // Check if the calculated seminar date is a holiday and reschedule if needed
    const rescheduleCheck = await holidayService.checkAndRescheduleSeminar(seminarDate);
    
    if (rescheduleCheck.needsReschedule) {
      console.log(`Direct cron - Holiday detected: ${rescheduleCheck.holidayName}`);
      console.log(`Direct cron - Seminar rescheduled from ${seminarDate} to ${rescheduleCheck.newDate}`);
      
      seminarDate = rescheduleCheck.newDate!;
      
      // If there were existing selections that got rescheduled, return the reschedule info
      if (rescheduleCheck.result) {
        return NextResponse.json({
          success: true,
          message: 'Direct cron: Seminar automatically rescheduled due to holiday',
          reschedule: rescheduleCheck.result,
          holidayReschedule: true,
          originalDate: rescheduleCheck.result.originalDate,
          newDate: rescheduleCheck.result.newDate,
          holidayName: rescheduleCheck.result.holidayName,
          affectedStudents: rescheduleCheck.result.affectedStudentsCount,
          source: 'direct-cron-holiday-reschedule'
        }, { status: 200 });
      }
    }
    
    const dayName = new Date(seminarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

    console.log('Processing selection for date:', seminarDate, '(' + dayName + ')');

    // Note: Sunday is a holiday - no seminars are scheduled on Sunday
    // But Sunday bookings target Monday seminars, so we allow Sunday cron execution
    const seminarDay = new Date(seminarDate + 'T12:00:00').getDay();
    if (seminarDay === 0) {
      return NextResponse.json(
        { error: 'Cannot schedule seminar on Sunday (holiday)', date: seminarDate },
        { status: 400 }
      );
    }

    // Check if selections already exist for tomorrow (should be exactly 2 selections max, one per class)
    const { data: existingSelections, error: selectionCheckError } = await supabase
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students(class_year)
      `)
      .eq('seminar_date', seminarDate);

    if (selectionCheckError) {
      console.error('Error checking existing selections:', selectionCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing selections', details: selectionCheckError.message },
        { status: 500 }
      );
    }

    // If we already have 2 or more selections, don't select more
    if (existingSelections && existingSelections.length >= 2) {
      console.log('Direct cron: Selections already complete for this date:', existingSelections.length, 'selections exist');
      return NextResponse.json(
        { 
          message: 'Selections already exist for this date (maximum 2 selections allowed)', 
          selections: existingSelections,
          source: 'direct-cron-validation'
        },
        { status: 200 }
      );
    }

    // Check if we already have one selection from each class
    if (existingSelections && existingSelections.length > 0) {
      const existingClasses = new Set(
        existingSelections.map((selection: any) => selection.unified_students?.class_year).filter(Boolean)
      );
      const hasIIIT = existingClasses.has('II-IT');
      const hasIIIIT = existingClasses.has('III-IT');
      
      if (hasIIIT && hasIIIIT) {
        console.log('Direct cron: Already have one selection from each class');
        return NextResponse.json(
          { 
            message: 'Selections already complete - one student from each class already selected', 
            selections: existingSelections,
            source: 'direct-cron-validation'
          },
          { status: 200 }
        );
      }
    }

    // Get all bookings for tomorrow with student details
    const { data: bookings, error: bookingsError } = await supabase
      .from('unified_seminar_bookings')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('booking_date', seminarDate) as { data: BookingWithStudent[] | null, error: any };

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: bookingsError.message },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found for date:', seminarDate);
      return NextResponse.json(
        { message: 'No bookings found for selection', date: seminarDate },
        { status: 200 }
      );
    }

    console.log(`Found ${bookings.length} bookings for selection`);

    // Get today's previous selections to avoid duplicate selections on the same day
    // Only consider selections made today for today's seminar date
    const today = new Date().toISOString().split('T')[0];
    
    const { data: previousSelections } = await supabase
      .from('unified_seminar_selections')
      .select('student_id')
      .eq('seminar_date', seminarDate); // Only get selections for the same seminar date

    const previouslySelectedStudentIds = new Set(
      (previousSelections as any[])?.map(selection => selection.student_id) || []
    );

    console.log(`Found ${previouslySelectedStudentIds.size} students already selected for ${seminarDate} to exclude`);

    // Filter out previously selected students
    const eligibleBookings = bookings.filter(booking => 
      !previouslySelectedStudentIds.has(booking.student_id)
    );

    if (eligibleBookings.length === 0) {
      return NextResponse.json(
        { 
          message: 'No eligible students available (all have been selected for this date)', 
          date: seminarDate,
          total_bookings: bookings.length,
          already_selected_count: previouslySelectedStudentIds.size,
          selection_basis: 'same-day bookings only'
        },
        { status: 200 }
      );
    }

    // Separate eligible bookings by class
    const iiItBookings = eligibleBookings.filter(booking => booking.unified_students.class_year === 'II-IT');
    const iiiItBookings = eligibleBookings.filter(booking => booking.unified_students.class_year === 'III-IT');

    console.log(`Direct cron - Eligible II-IT bookings: ${iiItBookings.length}, Eligible III-IT bookings: ${iiiItBookings.length}`);

    // Check which classes already have selections to avoid duplicate selections
    const existingClasses = new Set();
    if (existingSelections && existingSelections.length > 0) {
      existingSelections.forEach((selection: any) => {
        if (selection.unified_students?.class_year) {
          existingClasses.add(selection.unified_students.class_year);
        }
      });
    }

    const selectedStudents: Array<{ booking: BookingWithStudent; student: BookingWithStudent['unified_students'] }> = [];

    // Select one student from II-IT class if available AND not already selected
    if (iiItBookings.length > 0 && !existingClasses.has('II-IT')) {
      const randomIndex = Math.floor(Math.random() * iiItBookings.length);
      const selectedBooking = iiItBookings[randomIndex];
      selectedStudents.push({ booking: selectedBooking, student: selectedBooking.unified_students });
      console.log('Direct cron - Selected II-IT student:', selectedBooking.unified_students.register_number);
    } else if (existingClasses.has('II-IT')) {
      console.log('Direct cron - II-IT class already has a selection, skipping');
    } else {
      console.log('Direct cron - No eligible II-IT students available');
    }

    // Select one student from III-IT class if available AND not already selected
    if (iiiItBookings.length > 0 && !existingClasses.has('III-IT')) {
      const randomIndex = Math.floor(Math.random() * iiiItBookings.length);
      const selectedBooking = iiiItBookings[randomIndex];
      selectedStudents.push({ booking: selectedBooking, student: selectedBooking.unified_students });
      console.log('Direct cron - Selected III-IT student:', selectedBooking.unified_students.register_number);
    } else if (existingClasses.has('III-IT')) {
      console.log('Direct cron - III-IT class already has a selection, skipping');
    } else {
      console.log('Direct cron - No eligible III-IT students available');
    }

    if (selectedStudents.length === 0) {
      return NextResponse.json(
        { message: 'No students available for selection from either class', date: seminarDate },
        { status: 200 }
      );
    }

    // Final check before creating selections to prevent race conditions
    const { data: finalCheck } = await supabase
      .from('unified_seminar_selections')
      .select('id, unified_students(class_year)')
      .eq('seminar_date', seminarDate);
    
    if (finalCheck && finalCheck.length >= 2) {
      console.log('Direct cron - Race condition detected: selections were created by another process');
      return NextResponse.json(
        { 
          message: 'Selections were already created by another process', 
          date: seminarDate,
          source: 'direct-cron-race-condition-check'
        },
        { status: 200 }
      );
    }

    // Check for class conflicts in final check
    const finalExistingClasses = new Set(
      (finalCheck || []).map((selection: any) => selection.unified_students?.class_year).filter(Boolean)
    );
    
    // Filter out students from classes that now have selections
    const finalSelectedStudents = selectedStudents.filter(item => 
      !finalExistingClasses.has(item.student.class_year)
    );
    
    if (finalSelectedStudents.length === 0) {
      console.log('Direct cron - All selected classes already have selections after final check');
      return NextResponse.json(
        { 
          message: 'All selected classes already have selections', 
          date: seminarDate,
          source: 'direct-cron-final-check'
        },
        { status: 200 }
      );
    }

    // Create selection records
    const selectionResults: any[] = [];
    for (const { booking: selectedBooking } of finalSelectedStudents) {
      const { data: selection, error: selectionError } = await (supabase as any)
        .from('unified_seminar_selections')
        .insert([{
          student_id: selectedBooking.student_id,
          seminar_date: seminarDate,
          selected_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (selectionError) {
        console.error('Error creating selection:', selectionError);
        return NextResponse.json(
          { error: 'Failed to create selection', details: selectionError.message },
          { status: 500 }
        );
      }

      selectionResults.push(selection);
    }

    // Log successful selections
    for (const { student: selectedStudent } of finalSelectedStudents) {
      console.log('Successfully selected student:', selectedStudent.register_number, 'for seminar date:', seminarDate);
    }

    console.log('Direct cron selection completed successfully');

    return NextResponse.json({
      success: true,
      message: `Direct cron selection: ${finalSelectedStudents.length} student(s) selected successfully`,
      selections: finalSelectedStudents.map((item, index) => ({
        id: (selectionResults[index] as any)?.id,
        student: {
          register_number: item.student.register_number,
          name: item.student.name,
          email: item.student.email,
          class_year: item.student.class_year
        },
        seminar_date: seminarDate,
        selected_at: (selectionResults[index] as any)?.selected_at
      })),
      summary: {
        total_bookings: bookings.length,
        eligible_bookings: eligibleBookings.length,
        already_selected_excluded: previouslySelectedStudentIds.size,
        selection_basis: 'same-day bookings only',
        booking_date: today,
        seminar_date: seminarDate,
        ii_it_bookings: iiItBookings.length,
        iii_it_bookings: iiiItBookings.length,
        selected_count: finalSelectedStudents.length
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Direct cron selection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST(request: NextRequest) {
  return GET(request);
}