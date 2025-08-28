import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// Test endpoint to verify fine creation logic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testDate = searchParams.get('date') || '2024-01-15'; // Default test date

    console.log(`Testing fine logic for date: ${testDate}`);

    // Get all IT students
    const { data: allStudents, error: studentsError } = await supabaseAdmin
      .from('unified_students')
      .select('id, register_number, name, class_year')
      .in('class_year', ['II-IT', 'III-IT'])
      .limit(10); // Limit for testing

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Get students who booked for this date
    const { data: bookings } = await supabaseAdmin
      .from('unified_seminar_bookings')
      .select('student_id')
      .eq('booking_date', testDate);

    // Get students who completed seminars
    const { data: completedSeminars } = await supabaseAdmin
      .from('unified_seminar_selections')
      .select(`
        student_id,
        seminar_date,
        unified_seminar_attendance!inner(
          attendance_status
        )
      `)
      .eq('unified_seminar_attendance.attendance_status', 'present');

    // Get students selected for future seminars
    const { data: selectedStudents } = await supabaseAdmin
      .from('unified_seminar_selections')
      .select('student_id, seminar_date')
      .gte('seminar_date', testDate);

    // Create sets
    const bookedStudentIds = new Set(bookings?.map((b: any) => b.student_id) || []);
    const completedSeminarStudentIds = new Set(
      (completedSeminars || []).map((record: any) => record.student_id)
    );
    const selectedForFutureSeminarIds = new Set(
      (selectedStudents || []).map((record: any) => record.student_id)
    );

    // Apply logic
    const studentsToFine = (allStudents || []).filter((student: any) => {
      const didNotBook = !bookedStudentIds.has(student.id);
      const hasNotCompleted = !completedSeminarStudentIds.has(student.id);
      const notSelectedForFuture = !selectedForFutureSeminarIds.has(student.id);
      
      return didNotBook && hasNotCompleted && notSelectedForFuture;
    });

    const analysis = {
      testDate,
      totalStudents: allStudents?.length || 0,
      bookedStudents: bookedStudentIds.size,
      completedSeminars: completedSeminarStudentIds.size,
      selectedForFuture: selectedForFutureSeminarIds.size,
      studentsToFine: studentsToFine.length,
      logic: {
        description: "Students to fine = Students who (didn't book) AND (haven't completed seminar) AND (not selected for future)",
        conditions: [
          "Did not book for the specified date",
          "Have not completed their seminar presentation (no 'present' attendance record)",
          "Are not selected for any future seminar"
        ]
      },
      sampleStudentsToFine: studentsToFine.slice(0, 5).map((s: any) => ({
        register_number: s.register_number,
        name: s.name,
        class_year: s.class_year
      }))
    };

    return NextResponse.json({
      success: true,
      analysis,
      message: "Fine logic test completed successfully"
    });

  } catch (error) {
    console.error('Fine logic test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}