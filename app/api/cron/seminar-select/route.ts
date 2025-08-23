import { NextRequest, NextResponse } from 'next/server';
// Import the auto-select function directly to avoid HTTP authentication issues
import { POST as autoSelectHandler } from '../../seminar/auto-select/route';

export async function GET(request: NextRequest) {
  try {
    console.log('Cron job triggered at:', new Date().toISOString());
    
    // Call the auto-select function directly instead of making HTTP requests
    // This avoids Vercel authentication issues
    console.log('Calling auto-select handler directly');
    
    // Create a mock request for the auto-select handler
    const mockRequest = new NextRequest('http://localhost:3000/api/seminar/auto-select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Cron-Job-Internal',
      },
    });

    const response = await autoSelectHandler(mockRequest);
    const result = await response.json();
    
    console.log('Auto-select completed with status:', response.status);
    console.log('Auto-select result:', result);
    
    if (!response.ok) {
      console.error('Auto-select failed:', result);
      throw new Error(`Auto-select failed with status: ${response.status}`);
    }

    console.log('Cron job completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully via direct function call',
      result: result,
      timestamp: new Date().toISOString(),
      method: 'direct-function-call'
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job execution failed:', error);
    
    // If direct function call fails, try HTTP request as fallback with authentication bypass
    console.log('Attempting fallback HTTP request with authentication bypass...');
    
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/seminar/auto-select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Cron-Job-Fallback',
          // Add authorization header if available
          ...(process.env.CRON_SECRET ? { 'Authorization': `Bearer ${process.env.CRON_SECRET}` } : {}),
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Fallback HTTP request successful');
        return NextResponse.json({
          success: true,
          message: 'Cron job executed successfully via fallback HTTP request',
          result: result,
          timestamp: new Date().toISOString(),
          method: 'fallback-http'
        }, { status: 200 });
      }
    } catch (fallbackError) {
      console.error('Fallback HTTP request also failed:', fallbackError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      method: 'direct-function-call-failed'
    }, { status: 500 });
  }
}

// Also support POST method for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}