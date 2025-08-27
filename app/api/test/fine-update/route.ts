import { NextRequest, NextResponse } from 'next/server';
import { fineService } from '../../../../lib/fineService';

/**
 * Test endpoint for fine update functionality
 * GET /api/test/fine-update?seminarDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seminarDate = searchParams.get('seminarDate');

    if (!seminarDate) {
      return NextResponse.json({
        error: 'seminarDate parameter is required (YYYY-MM-DD format)'
      }, { status: 400 });
    }

    // Test the fine creation for non-booked students
    console.log('Testing fine creation for non-booked students on date:', seminarDate);
    
    const result = await fineService.createFinesForNonBookedStudents(seminarDate);
    
    return NextResponse.json({
      success: true,
      message: 'Fine update functionality test completed',
      testDate: seminarDate,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fine update test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Test endpoint for admin fine management functionality
 * POST /api/test/fine-update
 * Body: { action: 'create' | 'update_status' | 'delete', ...data }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'create':
        result = await fineService.createManualFine({
          student_id: data.student_id,
          fine_type: data.fine_type || 'other',
          reference_date: data.reference_date || new Date().toISOString().split('T')[0],
          amount: data.amount || 10, // Fixed amount per day
          payment_status: 'pending',
          description: data.description || 'Test fine'
        });
        break;

      case 'update_status':
        result = await fineService.updateFineStatus(
          data.fineId,
          data.status,
          data.notes
        );
        break;

      case 'delete':
        result = await fineService.deleteFine(data.fineId);
        break;

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: create, update_status, or delete'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Admin fine management test completed - ${action}`,
      action: action,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin fine management test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin fine management test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}