import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const classYear = searchParams.get('class_year');

    if (!studentId || !classYear) {
      return NextResponse.json(
        { error: 'Student ID and class year required' },
        { status: 400 }
      );
    }

    // 1. Get Assignment Completion Stats
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('class_year', classYear);

    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('assignment_id')
      .eq('student_id', studentId);

    const totalAssignments = assignments?.length || 0;
    const submittedAssignments = submissions?.length || 0;

    // 2. Get Seminar Status
    const { data: seminarSelections } = await supabase
      .from('unified_seminar_selections')
      .select('id, seminar_date, selected_at')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false });

    const hasTakenSeminar = (seminarSelections?.length || 0) > 0;
    const seminarCount = seminarSelections?.length || 0;

    // 3. Get Fine Details
    const { data: student } = await supabase
      .from('unified_students')
      .select('total_fine_amount')
      .eq('id', studentId)
      .single();

    const { data: fines } = await supabase
      .from('unified_student_fines')
      .select('amount, reason, fine_date, is_paid')
      .eq('student_id', studentId)
      .order('fine_date', { ascending: false });

    const totalFines = (student as any)?.total_fine_amount || 0;
    const unpaidFines = (fines as any[])?.filter((f: any) => !f.is_paid) || [];
    const fineCount = fines?.length || 0;

    // 4. Get Marks Data (IAT1, IAT2, Model)
    const { data: marks } = await supabase
      .from('unified_marks')
      .select('subject, iat1, iat2, model, signed, assignmentsubmitted')
      .eq('student_id', studentId);

    // Calculate averages and totals
    const marksArray = (marks as any[]) || [];
    const iat1Marks = marksArray.filter((m: any) => m.iat1 !== null).map((m: any) => m.iat1);
    const iat2Marks = marksArray.filter((m: any) => m.iat2 !== null).map((m: any) => m.iat2);
    const modelMarks = marksArray.filter((m: any) => m.model !== null).map((m: any) => m.model);

    const avgIat1 = iat1Marks.length > 0 ? Math.round(iat1Marks.reduce((a: number, b: number) => a + b, 0) / iat1Marks.length) : null;
    const avgIat2 = iat2Marks.length > 0 ? Math.round(iat2Marks.reduce((a: number, b: number) => a + b, 0) / iat2Marks.length) : null;
    const avgModel = modelMarks.length > 0 ? Math.round(modelMarks.reduce((a: number, b: number) => a + b, 0) / modelMarks.length) : null;

    const marksData = {
      iat1: avgIat1,
      iat2: avgIat2,
      model: avgModel,
      subjects: marksArray,
      totalSubjects: marksArray.length,
      signedSubjects: marksArray.filter((m: any) => m.signed).length,
      assignmentsSubmitted: marksArray.filter((m: any) => m.assignmentsubmitted).length
    };

    // 5. Calculate completion percentage
    const assignmentCompletion = totalAssignments > 0 
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        assignments: {
          total: totalAssignments,
          submitted: submittedAssignments,
          pending: totalAssignments - submittedAssignments,
          completionPercentage: assignmentCompletion
        },
        seminar: {
          hasTaken: hasTakenSeminar,
          count: seminarCount,
          lastPresentation: seminarSelections?.[0] || null
        },
        fines: {
          total: totalFines,
          count: fineCount,
          unpaidCount: unpaidFines.length,
          recentFines: fines?.slice(0, 3) || []
        },
        marks: marksData,
        overallStatus: {
          assignmentsGood: assignmentCompletion >= 80,
          seminarGood: hasTakenSeminar,
          finesGood: totalFines === 0,
          marksAvailable: marksArray.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profile overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}
