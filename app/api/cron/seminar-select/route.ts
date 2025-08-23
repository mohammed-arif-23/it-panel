import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Cron job triggered at:', new Date().toISOString());
    
    // This endpoint will be called by Vercel Cron Jobs
    // Trigger the auto-select process
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : `https://${request.headers.get('host')}`;
    
    console.log('Making request to:', `${baseUrl}/api/seminar/auto-select`);
    
    const response = await fetch(`${baseUrl}/api/seminar/auto-select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Cron-Job',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Auto-select failed:', result);
      throw new Error(`Auto-select failed with status: ${response.status}`);
    }

    console.log('Cron job completed successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      result: result,
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job execution failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}