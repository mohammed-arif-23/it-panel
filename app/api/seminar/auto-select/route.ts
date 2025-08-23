import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { emailService } from '../../../../lib/emailService';

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
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get tomorrow's date (the seminar date)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const seminarDate = tomorrow.toISOString().split('T')[0];

    console.log('Starting auto-selection for date:', seminarDate);

    // Check if selection already exists for tomorrow
    const { data: existingSelection, error: selectionCheckError } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('seminar_date', seminarDate)
      .single();

    if (existingSelection) {
      return NextResponse.json(
        { message: 'Selection already exists for this date', selection: existingSelection },
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

    // Randomly select one student
    const randomIndex = Math.floor(Math.random() * bookings.length);
    const selectedBooking = bookings[randomIndex];
    const selectedStudent = selectedBooking.unified_students;

    console.log('Selected student:', selectedStudent.register_number);

    // Create the selection record
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

    // Get the selected student's booking to get the seminar topic
    const { data: booking } = await supabase
      .from('unified_seminar_bookings')
      .select('seminar_topic')
      .eq('student_id', selectedBooking.student_id)
      .eq('booking_date', seminarDate)
      .single();

    // Add proper typing to the booking object
    const seminarTopic = (booking as { seminar_topic?: string } | null)?.seminar_topic || 'Not provided';

    // Format the seminar date for email
    const formattedDate = tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email notification to selected student
    try {
      const emailSent = await emailService.sendSelectionNotification({
        email: selectedStudent.email,
        name: selectedStudent.name || selectedStudent.register_number,
        registerNumber: selectedStudent.register_number,
        seminarDate: formattedDate,
        seminarTopic: seminarTopic
      });

      if (emailSent) {
        console.log('Selection email sent successfully to:', selectedStudent.email);
      } else {
        console.error('Failed to send selection email to:', selectedStudent.email);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the selection if email fails
    }

    return NextResponse.json({
      message: 'Student selected successfully',
      selection: {
        id: (selection as any).id,
        student: {
          register_number: selectedStudent.register_number,
          name: selectedStudent.name,
          email: selectedStudent.email
        },
        seminar_date: seminarDate,
        selected_at: (selection as any).selected_at,
        total_bookings: bookings.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Auto-selection error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check selection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const { data: selection, error } = await supabase
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('seminar_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch selection', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      selection: selection || null,
      exists: !!selection
    }, { status: 200 });

  } catch (error) {
    console.error('Selection check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}