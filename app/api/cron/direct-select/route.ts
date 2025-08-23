import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { emailService } from '../../../../lib/emailService';
import { seminarTimingService } from '../../../../lib/seminarTimingService';

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
    
    // Get next seminar date (supports Sunday booking for Monday seminars)
    const seminarDate = seminarTimingService.getNextSeminarDate();
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

    // Check if selections already exist for tomorrow
    const { data: existingSelections } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('seminar_date', seminarDate);

    if (existingSelections && existingSelections.length >= 2) {
      console.log('Selections already exist for this date');
      return NextResponse.json(
        { message: 'Selections already exist for this date', selections: existingSelections },
        { status: 200 }
      );
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

    const selectedStudents: Array<{ booking: BookingWithStudent; student: BookingWithStudent['unified_students'] }> = [];

    // Select one student from each class
    if (iiItBookings.length > 0) {
      const randomIndex = Math.floor(Math.random() * iiItBookings.length);
      const selectedBooking = iiItBookings[randomIndex];
      selectedStudents.push({ booking: selectedBooking, student: selectedBooking.unified_students });
      console.log('Selected II-IT student:', selectedBooking.unified_students.register_number);
    }

    if (iiiItBookings.length > 0) {
      const randomIndex = Math.floor(Math.random() * iiiItBookings.length);
      const selectedBooking = iiiItBookings[randomIndex];
      selectedStudents.push({ booking: selectedBooking, student: selectedBooking.unified_students });
      console.log('Selected III-IT student:', selectedBooking.unified_students.register_number);
    }

    if (selectedStudents.length === 0) {
      return NextResponse.json(
        { message: 'No students available for selection from either class', date: seminarDate },
        { status: 200 }
      );
    }

    // Create selection records
    const selectionResults: any[] = [];
    for (const { booking: selectedBooking } of selectedStudents) {
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

    // Send email notifications
    const formattedDate = new Date(seminarDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResults = [];
    for (const { booking: selectedBooking, student: selectedStudent } of selectedStudents) {
      try {
        const { data: booking } = await supabase
          .from('unified_seminar_bookings')
          .select('seminar_topic')
          .eq('student_id', selectedBooking.student_id)
          .eq('booking_date', seminarDate)
          .single();

        const seminarTopic = (booking as { seminar_topic?: string } | null)?.seminar_topic || 'Not provided';

        const emailSent = await emailService.sendSelectionNotification({
          email: selectedStudent.email,
          name: selectedStudent.name || selectedStudent.register_number,
          registerNumber: selectedStudent.register_number,
          seminarDate: formattedDate,
          seminarTopic: seminarTopic,
          classYear: selectedStudent.class_year
        });

        emailResults.push({
          student: selectedStudent.register_number,
          class: selectedStudent.class_year,
          emailSent
        });

        console.log('Email result for', selectedStudent.register_number, ':', emailSent);
      } catch (emailError) {
        console.error('Email error for student', selectedStudent.register_number, ':', emailError);
      }
    }

    console.log('Direct cron selection completed successfully');

    return NextResponse.json({
      success: true,
      message: `Direct cron selection: ${selectedStudents.length} student(s) selected successfully`,
      selections: selectedStudents.map((item, index) => ({
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
        selected_count: selectedStudents.length
      },
      email_results: emailResults,
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