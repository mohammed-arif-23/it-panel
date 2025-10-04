import { NextRequest, NextResponse } from 'next/server'

// GET /api/lab-manuals/departments
// Returns available departments for lab manuals
export async function GET(req: NextRequest) {
  try {
    // Return standard departments
    const departments = ['IT', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL']
    return NextResponse.json({ success: true, departments })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
