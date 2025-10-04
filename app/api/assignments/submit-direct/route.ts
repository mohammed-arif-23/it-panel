import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateFileHash } from '@/lib/hashUtils'
import { safeParseJSON, errorResponse } from '@/lib/apiMiddleware'

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
  // Add CORS headers - restrict to specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean)
  
  const origin = request.headers.get('origin')
  const corsHeaders = new Headers()
  
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders.set('Access-Control-Allow-Origin', origin)
  }
  
  corsHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  corsHeaders.set('Access-Control-Allow-Credentials', 'true')
  
  try {
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders })
    }
    
    // Safe JSON parsing with size limit (2MB for file metadata)
    const parseResult = await safeParseJSON<{
      assignment_id: string
      student_id: string
      file_url: string
      file_name: string
      file_size: number
      cloudinary_public_id: string
    }>(request, 2 * 1024 * 1024)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error },
        { status: parseResult.status, headers: corsHeaders }
      )
    }

    const { assignment_id, student_id, file_url, file_name, file_size, cloudinary_public_id } = parseResult.data

    // Validate required fields
    if (!assignment_id || !student_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment_id, student_id, file_url, file_name' }, 
        { status: 400, headers: corsHeaders }
      )
    }

    // More robust file URL validation for Flutter WebView
    if (!file_url || typeof file_url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid file URL provided' }, 
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate Cloudinary URL format (allow folders, optional version, and query strings)
    // Examples:
    // https://res.cloudinary.com/<cloud>/raw/upload/v1721234567/assignments/myfile_123.pdf
    // https://res.cloudinary.com/<cloud>/raw/upload/myfile.pdf
    // https://res.cloudinary.com/<cloud>/image/upload/v1721234567/folder/name.png?some=param
    const cloudinaryRegex = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/(?:raw|image|video)\/upload\/(?:v\d+\/)?.+\.[^\/?#\s]+(?:\?.*)?$/
    if (!cloudinaryRegex.test(file_url)) {
      console.warn('Rejecting submission due to unexpected Cloudinary URL format:', file_url)
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL format' }, 
        { status: 400, headers: corsHeaders }
      )
    }

    // Calculate file hash for plagiarism detection
    console.log('Calculating file hash for plagiarism detection...')
    let fileHash: string
    try {
      fileHash = await calculateFileHash(file_url)
      console.log('File hash calculated successfully:', fileHash.substring(0, 8) + '...')
    } catch (hashError) {
      console.error('Error calculating file hash:', hashError)
      return NextResponse.json(
        { error: 'Failed to process file for plagiarism detection' }, 
        { status: 500, headers: corsHeaders }
      )
    }

    // Check for plagiarism (exact hash match)
    console.log('Checking for plagiarism...')
    try {
      const { data: existingSubmission, error: plagiarismError } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          student_id,
          file_name,
          submitted_at,
          unified_students!assignment_submissions_student_id_fkey (
            name,
            register_number
          )
        `)
        .eq('file_hash', fileHash)
        .eq('assignment_id', assignment_id)
        .neq('student_id', student_id)
        .maybeSingle()

      if (plagiarismError && plagiarismError.code !== 'PGRST116') {
        console.error('Error checking plagiarism:', plagiarismError)
        return NextResponse.json(
          { error: 'Failed to check for plagiarism' }, 
          { status: 500, headers: corsHeaders }
        )
      }

      if (existingSubmission) {
        const student = existingSubmission.unified_students as any
        const matchedStudentName = student?.name || 'Unknown Student'
        const matchedRegisterNumber = student?.register_number || 'Unknown'
        
        console.log(`Plagiarism detected! Matched with: ${matchedStudentName} (${matchedRegisterNumber})`)
        
        return NextResponse.json(
          { 
            error: `Plagiarism detected! You are uploading ${matchedStudentName}'s assignment (${matchedRegisterNumber}). Upload failed.`,
            plagiarism_detected: true,
            matched_student: {
              name: matchedStudentName,
              register_number: matchedRegisterNumber,
              submission_date: existingSubmission.submitted_at
            }
          }, 
          { status: 400, headers: corsHeaders }
        )
      }
      
      console.log('No plagiarism detected. Proceeding with submission...')
    } catch (plagiarismCheckError) {
      console.error('Error during plagiarism check:', plagiarismCheckError)
      return NextResponse.json(
        { error: 'Failed to verify file originality' }, 
        { status: 500, headers: corsHeaders }
      )
    }

    // Check for existing submission by this student for this assignment
    // This prevents duplicate submissions (idempotency)
    const { data: existingSubmission, error: checkError } = await supabase
      .from('unified_assignment_submissions')
      .select('id, file_hash, created_at')
      .eq('student_id', student_id)
      .eq('assignment_id', assignment_id)
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { 
          error: 'You have already submitted this assignment.',
          submission_id: existingSubmission.id,
          submitted_at: existingSubmission.created_at
        },
        { status: 409, headers: corsHeaders } // 409 Conflict
      )
    }

    // Generate random marks (8 or 9 out of 10)
    const randomMarks = Math.floor(Math.random() * 2) + 8

    // Build IST timestamp string (+05:30)
    const now = new Date()
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const istTimestamp = `${istNow.getUTCFullYear()}-${pad(istNow.getUTCMonth() + 1)}-${pad(istNow.getUTCDate())}T${pad(istNow.getUTCHours())}:${pad(istNow.getUTCMinutes())}:${pad(istNow.getUTCSeconds())}+05:30`

    // Insert submission using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id,
        student_id,
        file_url,
        file_name,
        file_hash: fileHash,
        marks: randomMarks,
        status: 'graded',
        submitted_at: istTimestamp,
        graded_at: istTimestamp,
        hash_generated_at: istTimestamp
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    // Log successful submission
    console.log('Assignment submission created:', {
      submissionId: data.id,
      studentId: student_id,
      assignmentId: assignment_id,
      fileName: file_name,
      fileHash: fileHash.substring(0, 8) + '...',
      marks: randomMarks
    })

    return NextResponse.json({ 
      success: true,
      data, 
      marks: randomMarks,
      message: 'Assignment submitted successfully!',
      plagiarism_checked: true
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Server error in assignment submission:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid request format. Expected JSON.' }, 
          { status: 400, headers: corsHeaders }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    )
  }
}