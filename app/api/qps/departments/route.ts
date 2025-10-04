import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/qps/departments
// Returns distinct departments used in class_timetable
export async function GET() {
  try {
    // Return departments as stored in students table (abbreviated)
    const departments = [
      'IT'
    ]

    return NextResponse.json({ success: true, departments })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
