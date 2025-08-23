import { NextRequest, NextResponse } from 'next/server';
import { seminarTimingService } from '../../../../lib/seminarTimingService';

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Test the new seminar date logic
    const nextSeminarDate = seminarTimingService.getNextSeminarDate();
    const scheduleInfo = seminarTimingService.getSeminarScheduleInfo();
    
    // Simulate what the cron job would do
    const seminarDay = new Date(nextSeminarDate + 'T12:00:00').getDay();
    const canRunCron = true; // Always true now, even on Sunday
    const willScheduleSeminarOnSunday = seminarDay === 0; // This should always be false
    
    return NextResponse.json({
      test_info: {
        today: {
          date: today.toISOString().split('T')[0],
          day_name: dayName,
          day_of_week: dayOfWeek,
          is_sunday: dayOfWeek === 0
        },
        seminar: {
          date: nextSeminarDate,
          day_name: new Date(nextSeminarDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
          day_of_week: seminarDay,
          is_sunday: seminarDay === 0
        },
        cron_behavior: {
          can_run_cron_today: canRunCron,
          will_schedule_on_sunday: willScheduleSeminarOnSunday,
          schedule_description: scheduleInfo.scheduleDescription
        },
        sunday_logic: {
          enabled: "✅ Sunday cron job now enabled",
          purpose: dayOfWeek === 0 ? "Select from Sunday bookings for Monday seminar" : "Normal day operation",
          seminar_target: nextSeminarDate
        }
      },
      status: willScheduleSeminarOnSunday ? "❌ ERROR: Trying to schedule on Sunday!" : "✅ OK: Proper scheduling",
      cron_schedule: "0 19 * * 0-6 (daily including Sunday)"
    });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}