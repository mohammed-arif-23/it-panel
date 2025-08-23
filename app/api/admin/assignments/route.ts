import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session')
  return adminSession?.value === 'authenticated'
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description, class_year, due_date } = await request.json()

    // Validate required fields
    if (!title || !class_year || !due_date) {
      return NextResponse.json({ error: 'Title, class year, and due date are required' }, { status: 400 })
    }

    // Validate class_year
    if (!['II-IT', 'III-IT'].includes(class_year)) {
      return NextResponse.json({ error: 'Invalid class year. Must be "II-IT" or "III-IT"' }, { status: 400 })
    }

    // Insert new assignment using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title,
        description: description || '',
        class_year,
        due_date
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all assignments with submission counts
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions (
          id,
          status,
          marks,
          submitted_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add submission statistics
    const assignmentsWithStats = assignments?.map(assignment => {
      const submissions = assignment.assignment_submissions || []
      return {
        ...assignment,
        submission_count: submissions.length,
        graded_count: submissions.filter((s: any) => s.status === 'graded').length,
        average_marks: submissions.length > 0 
          ? Math.round(submissions.reduce((sum: number, s: any) => sum + (s.marks || 0), 0) / submissions.length)
          : 0
      }
    })

    return NextResponse.json({ data: assignmentsWithStats })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Delete assignment (will cascade delete submissions due to foreign key)
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}