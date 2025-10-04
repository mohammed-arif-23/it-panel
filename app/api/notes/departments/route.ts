import { NextRequest, NextResponse } from 'next/server'

// GET /api/notes/departments
// Returns available departments for notes
export async function GET(req: NextRequest) {
  try {
    const departments = ['IT', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL']
    return NextResponse.json({ success: true, departments })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
