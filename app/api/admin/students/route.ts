import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  return adminSession?.value === 'authenticated';
}

// Validate student data
function validateStudentData(data: any) {
  const errors: string[] = [];

  if (!data.register_number || data.register_number.length !== 12) {
    errors.push('Register number must be exactly 12 digits');
  }

  if (!/^\d{12}$/.test(data.register_number)) {
    errors.push('Register number must contain only digits');
  }

  if (!data.name?.trim()) {
    errors.push('Name is required');
  }

  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  const validClassYears = ['II-IT', 'III-IT'];
  if (!validClassYears.includes(data.class_year)) {
    errors.push('Invalid class year. Must be II-IT, III-IT');
  }

  return errors;
}

// POST - Create new student
export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ...studentData } = body;

    if (action !== 'create') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Validate student data
    const validationErrors = validateStudentData(studentData);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    // Check for duplicates
    const { data: existingStudent, error: checkError } = await (supabaseAdmin as any)
      .from('unified_students')
      .select('id, register_number, email')
      .or(`register_number.eq.${studentData.register_number},email.eq.${studentData.email.toLowerCase()}`)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing student:', checkError);
      return NextResponse.json({ error: 'Failed to check existing student records' }, { status: 500 });
    }

    if (existingStudent) {
      if (existingStudent.register_number === studentData.register_number) {
        return NextResponse.json({ error: 'A student with this register number already exists' }, { status: 409 });
      }
      if (existingStudent.email === studentData.email.toLowerCase()) {
        return NextResponse.json({ error: 'A student with this email address already exists' }, { status: 409 });
      }
    }

    // Create the student record
    const { data: newStudent, error: insertError } = await (supabaseAdmin as any)
      .from('unified_students')
      .insert({
        register_number: studentData.register_number,
        name: studentData.name.trim(),
        email: studentData.email.toLowerCase().trim(),
        mobile: studentData.mobile?.trim() || null,
        class_year: studentData.class_year,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating student:', insertError);
      return NextResponse.json({ error: 'Failed to create student record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      data: newStudent
    });

  } catch (error) {
    console.error('Student creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing student
export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...studentData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Validate student data
    const validationErrors = validateStudentData(studentData);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    // Check for duplicates (excluding current student)
    const { data: existingStudent, error: checkError } = await (supabaseAdmin as any)
      .from('unified_students')
      .select('id, register_number, email')
      .or(`register_number.eq.${studentData.register_number},email.eq.${studentData.email.toLowerCase()}`)
      .neq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing student:', checkError);
      return NextResponse.json({ error: 'Failed to check existing student records' }, { status: 500 });
    }

    if (existingStudent) {
      if (existingStudent.register_number === studentData.register_number) {
        return NextResponse.json({ error: 'Another student with this register number already exists' }, { status: 409 });
      }
      if (existingStudent.email === studentData.email.toLowerCase()) {
        return NextResponse.json({ error: 'Another student with this email address already exists' }, { status: 409 });
      }
    }

    // Update the student record
    const { data: updatedStudent, error: updateError } = await (supabaseAdmin as any)
      .from('unified_students')
      .update({
        register_number: studentData.register_number,
        name: studentData.name.trim(),
        email: studentData.email.toLowerCase().trim(),
        mobile: studentData.mobile?.trim() || null,
        class_year: studentData.class_year,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating student:', updateError);
      return NextResponse.json({ error: 'Failed to update student record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Student update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Delete the student record
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('unified_students')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting student:', deleteError);
      return NextResponse.json({ error: 'Failed to delete student record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Student deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Supabase not configured. Please set up your Supabase environment variables.',
        timestamp: new Date().toISOString()
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const classYear = searchParams.get('class') || 'all';
    const verification = searchParams.get('verification') || 'all';

    // Check if students table exists
    let studentsExist = false;
    try {
      const { data: tableTest, error: tableCheckError } = await (supabaseAdmin as any)
        .from('unified_students')
        .select('id')
        .limit(1);
      
      studentsExist = !tableCheckError;
    } catch (error) {
      console.log('unified_students table does not exist or is not accessible');
      studentsExist = false;
    }

    if (!studentsExist) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Students table not found. Please create the table first.',
        timestamp: new Date().toISOString()
      });
    }

    // Build query for students with all fields
    let studentsQuery = (supabaseAdmin as any)
      .from('unified_students')
      .select('id, register_number, name, email, mobile, class_year, email_verified, created_at, updated_at')
      .order('created_at', { ascending: false });

    // Apply class filter
    if (classYear !== 'all') {
      studentsQuery = studentsQuery.eq('class_year', classYear);
    }

    // Apply verification filter
    if (verification === 'verified') {
      studentsQuery = studentsQuery.eq('email_verified', true);
    } else if (verification === 'unverified') {
      studentsQuery = studentsQuery.eq('email_verified', false);
    }

    // Apply search filter
    if (search) {
      studentsQuery = studentsQuery.or(`name.ilike.%${search}%,register_number.ilike.%${search}%,email.ilike.%${search}%`);
    }


    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students', details: studentsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: students || [],
      count: (students || []).length,
      filters: { search, classYear, verification },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}