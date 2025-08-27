import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure timeouts for this route
export const maxDuration = 30
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      assignment_id, 
      student_id, 
      file_url, 
      file_name, 
      file_size,
      cloudinary_public_id 
    } = body

    // Validate required fields
    if (!assignment_id || !student_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment_id, student_id, file_url, file_name' }, 
        { status: 400 }
      )
    }

    // Validate file URL is from Cloudinary
    if (!file_url.includes('cloudinary.com')) {
      return NextResponse.json(
        { error: 'Invalid file URL. Must be from Cloudinary.' }, 
        { status: 400 }
      )
    }

    // Generate random marks (8 or 9 out of 10)
    const randomMarks = Math.floor(Math.random() * 2) + 8

    // Insert submission using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id,
        student_id,
        file_url,
        file_name,
        marks: randomMarks,
        status: 'graded'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log successful submission
    console.log('Assignment submission created:', {
      submissionId: data.id,
      studentId: student_id,
      assignmentId: assignment_id,
      fileName: file_name,
      fileSize: file_size,
      marks: randomMarks
    })

    return NextResponse.json({ 
      success: true,
      data, 
      marks: randomMarks,
      message: 'Assignment submitted successfully!'
    })

  } catch (error) {
    console.error('Server error in assignment submission:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid request format. Expected JSON.' }, 
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}