import { NextRequest, NextResponse } from 'next/server'

// GET /api/notes/years?dept=IT
// Returns academic years for notes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dept = searchParams.get('dept')

    if (!dept) {
      return NextResponse.json({ success: false, error: 'dept is required' }, { status: 400 })
    }

    const years = ['1st year', '2nd year', '3rd year', '4th year']
    return NextResponse.json({ success: true, years })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
