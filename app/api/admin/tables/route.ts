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
        tables: [
          'unified_students',
          'unified_student_registrations',
          'unified_assignments',
          'unified_submissions',
          'unified_student_fines',
          'unified_seminar_bookings',
          'unified_nptel_enrollments',
          'unified_nptel_progress'
        ],
        message: 'Supabase not configured. Showing default table list.',
        timestamp: new Date().toISOString()
      });
    }

    // Try to get list of tables - use direct queries instead of information_schema
    let tableNames: string[] = [];
    
    // List of expected tables in the unified college app
    const expectedTables = [
      'unified_students',
      'unified_student_registrations', 
      'unified_assignments',
      'unified_submissions',
      'unified_student_fines',
      'unified_seminar_bookings',
      'unified_nptel_enrollments',
      'unified_nptel_progress'
    ];
    
    // Test each table to see if it exists
    for (const tableName of expectedTables) {
      try {
        const { error } = await (supabaseAdmin as any)
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          tableNames.push(tableName);
        }
      } catch (tableError) {
        console.log(`Table ${tableName} does not exist or is not accessible`);
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableNames,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tables fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}