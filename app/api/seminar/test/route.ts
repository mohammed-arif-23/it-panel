import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../../lib/emailService';

export const config = {
  runtime: 'edge',
  unstable_noStore: true,
};

// Enable cron job execution
export async function GET(request: NextRequest) {
  try {
    // Test email service connection
    const isConnected = await emailService.testConnection();
    
    // Get environment configuration
    const config = {
      bookingWindow: {
        startHour: process.env.NEXT_PUBLIC_BOOKING_WINDOW_START_HOUR || '10',
        startMinute: process.env.NEXT_PUBLIC_BOOKING_WINDOW_START_MINUTE || '30',
        endHour: process.env.NEXT_PUBLIC_BOOKING_WINDOW_END_HOUR || '13',
        endMinute: process.env.NEXT_PUBLIC_BOOKING_WINDOW_END_MINUTE || '30'
      },
      selection: {
        hour: process.env.NEXT_PUBLIC_SELECTION_HOUR || '13',
        minute: process.env.NEXT_PUBLIC_SELECTION_MINUTE || '30'
      },
      email: {
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        host: process.env.SMTP_HOST || 'Not configured',
        user: process.env.SMTP_USER ? '***' : 'Not configured'
      }
    };

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        email: {
          connected: isConnected,
          configured: config.email.configured
        }
      },
      configuration: config
    }, { status: 200 });

  } catch (error) {
    console.error('System check error:', error);
    return NextResponse.json(
      { 
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'test-email') {
      // Send a test email
      const testResult = await emailService.sendSelectionNotification({
        email: process.env.SMTP_USER || 'test@example.com',
        name: 'Test Student',
        registerNumber: 'TEST123',
        seminarDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      return NextResponse.json({
        success: testResult,
        message: testResult ? 'Test email sent successfully' : 'Failed to send test email'
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}