import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// Check admin authentication
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.cookies.get('admin-session');
  return adminSession?.value === 'authenticated';
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

    // Build query for students
    let studentsQuery = (supabaseAdmin as any)
      .from('unified_students')
      .select('id, register_number, name, email, class_year')
      .order('name', { ascending: true });

    // Apply class filter
    if (classYear !== 'all') {
      studentsQuery = studentsQuery.eq('class_year', classYear);
    }

    // Apply search filter
    if (search) {
      studentsQuery = studentsQuery.or(`name.ilike.%${search}%,register_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Limit results to avoid large datasets
    studentsQuery = studentsQuery.limit(50);

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
      filters: { search, classYear },
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