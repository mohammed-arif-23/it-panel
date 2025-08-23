import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const currentTime = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Test the cron endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : `https://${request.headers.get('host')}`;

    return NextResponse.json({
      status: 'OK',
      message: 'Cron test endpoint working',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        host: request.headers.get('host'),
        baseUrl: baseUrl
      },
      time: {
        current: currentTime.toISOString(),
        timezone: timeZone,
        utc: currentTime.toUTCString()
      },
      cronEndpoint: `${baseUrl}/api/cron/seminar-select`,
      autoSelectEndpoint: `${baseUrl}/api/seminar/auto-select`
    }, { status: 200 });

  } catch (error) {
    console.error('Cron test error:', error);
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Manually trigger the cron job for testing
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : `https://${request.headers.get('host')}`;
    
    console.log('Manual cron trigger initiated');
    
    const response = await fetch(`${baseUrl}/api/cron/seminar-select`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      message: 'Manual cron trigger completed',
      cronResult: result,
      timestamp: new Date().toISOString()
    }, { status: response.ok ? 200 : 500 });

  } catch (error) {
    console.error('Manual cron trigger error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}