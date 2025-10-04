import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/qps/subjects-by-semester?dept=IT&year=III%20YEAR&semester=Semester%205
// Returns subjects filtered by department, year, and semester from the subjects table
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dept = searchParams.get('dept')
    const year = searchParams.get('year')
    const semester = searchParams.get('semester')

    if (!dept || !year || !semester) {
      return NextResponse.json({ success: false, error: 'dept, year, and semester are required' }, { status: 400 })
    }

    // Map semester text to semester number
    const semesterMap: { [key: string]: number } = {
      'Semester 1': 1,
      'Semester 2': 2,
      'Semester 3': 3,
      'Semester 4': 4,
      'Semester 5': 5,
      'Semester 6': 6,
      'Semester 7': 7,
      'Semester 8': 8
    }

    const semesterNumber = semesterMap[semester]
    if (!semesterNumber) {
      return NextResponse.json({ success: false, error: 'Invalid semester format' }, { status: 400 })
    }

    // Query subjects table for the specific semester and department
    const { data, error } = await (supabase as any)
      .from('subjects')
      .select('code, name, category, course_type, credits')
      .eq('department', dept)
      .eq('semester', semesterNumber)
      .order('code')

    if (error) {
      console.error('Error fetching subjects by semester', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch subjects' }, { status: 500 })
    }

    // Transform to match existing interface
    const subjects = (data || []).map((subject: any) => ({
      code: subject.code,
      name: subject.name,
      staff: null, // Will be populated from timetable if needed
      internal: subject.category || null
    }))

    return NextResponse.json({ success: true, subjects })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
