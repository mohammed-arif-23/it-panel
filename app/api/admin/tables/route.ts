import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

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
    // Define available tables with their display names and descriptions
    const tables = [
      {
        name: 'unified_students',
        displayName: 'Students',
        description: 'All student records',
        type: 'unified'
      },
      {
        name: 'unified_seminar_bookings',
        displayName: 'Seminar Bookings',
        description: 'Student seminar booking records',
        type: 'unified'
      },
      {
        name: 'unified_seminar_selections',
        displayName: 'Seminar Selections',
        description: 'Selected students for seminars',
        type: 'unified'
      },
      {
        name: 'ii_it_students',
        displayName: 'II IT Students (Legacy)',
        description: 'Legacy NPTEL records for II IT students',
        type: 'legacy'
      },
      {
        name: 'iii_it_students',
        displayName: 'III IT Students (Legacy)',
        description: 'Legacy NPTEL records for III IT students',
        type: 'legacy'
      }
    ];

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}