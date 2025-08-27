import { NextRequest, NextResponse } from 'next/server';
import { holidayService } from '../../../../lib/holidayService';
import { seminarTimingService } from '../../../../lib/seminarTimingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testDate = searchParams.get('date');
    
    // Use provided date or get next seminar date
    const seminarDate = testDate || seminarTimingService.getNextSeminarDate();
    
    console.log('Testing holiday reschedule for date:', seminarDate);
    
    // Test holiday checking
    const { isHoliday, holiday } = await holidayService.isHoliday(seminarDate);
    
    let rescheduleResult = null;
    let newDate = null;
    
    if (isHoliday) {
      console.log(`Holiday detected: ${holiday!.holiday_name}`);
      
      // Get next working day
      newDate = await holidayService.getNextWorkingDay(seminarDate, 1);
      
      // Test full reschedule process
      rescheduleResult = await holidayService.checkAndRescheduleSeminar(seminarDate);
    }
    
    // Test holiday-aware date calculation
    const holidayAwareDate = await holidayService.getHolidayAwareNextSeminarDate();
    
    return NextResponse.json({
      test_info: {
        input_date: seminarDate,
        day_name: new Date(seminarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
        is_holiday: isHoliday,
        holiday_details: holiday || null,
        next_working_day: newDate,
        holiday_aware_seminar_date: holidayAwareDate
      },
      reschedule_check: rescheduleResult,
      demo_scenario: {
        explanation: isHoliday 
          ? `✅ Holiday detected! Seminar would be rescheduled from ${seminarDate} to ${newDate}`
          : `❌ No holiday detected for ${seminarDate}. Seminar proceeds as scheduled.`,
        student_notification: isHoliday 
          ? `Students would receive notification: "Your seminar scheduled for ${new Date(seminarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} has been moved to ${new Date(newDate! + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} due to ${holiday!.holiday_name}."`
          : 'No notification needed - seminar proceeds as scheduled.'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Holiday reschedule test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, holidayName, holidayType = 'emergency' } = await request.json();
    
    if (!date || !holidayName) {
      return NextResponse.json(
        { error: 'Date and holiday name are required' },
        { status: 400 }
      );
    }
    
    // This would create a test holiday for demonstration
    // In a real scenario, this would be handled by the admin holiday creation
    console.log(`Test scenario: Creating holiday "${holidayName}" on ${date}`);
    
    // Test the reschedule logic
    const rescheduleResult = await holidayService.checkAndRescheduleSeminar(date);
    
    return NextResponse.json({
      success: true,
      message: 'Test holiday reschedule simulation completed',
      simulation: {
        holiday: {
          name: holidayName,
          date: date,
          type: holidayType
        },
        reschedule_result: rescheduleResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Holiday reschedule simulation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}