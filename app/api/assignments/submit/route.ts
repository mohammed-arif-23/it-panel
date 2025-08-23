import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const assignmentId = formData.get('assignment_id') as string
    const studentId = formData.get('student_id') as string
    const registerNumber = formData.get('register_number') as string

    if (!file || !assignmentId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${registerNumber}_${assignmentId}_${Date.now()}.${fileExt}`

    // Upload file to Supabase storage using service role
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assignments')
      .getPublicUrl(fileName)

    // Generate random marks (80-90 out of 100, which is 8/9 out of 10)
    const randomMarks = (Math.floor(Math.random() * 11) + 80)/10

    // Insert submission using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        marks: randomMarks,
        status: 'graded'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, marks: randomMarks })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}