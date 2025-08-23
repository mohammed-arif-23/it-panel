import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Cron job triggered at:', new Date().toISOString());
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Build the base URL more carefully
    let baseUrl: string;
    
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000';
    } else {
      // Extract from request URL as fallback
      const url = new URL(request.url);
      baseUrl = `${url.protocol}//${url.host}`;
    }
    
    const autoSelectUrl = `${baseUrl}/api/seminar/auto-select`;
    console.log('Base URL:', baseUrl);
    console.log('Making request to:', autoSelectUrl);
    
    // First, test if the API is reachable
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Cron-Job-Health-Check',
        },
      });
      
      if (!healthResponse.ok) {
        console.warn('Health check failed:', healthResponse.status);
      } else {
        console.log('Health check passed');
      }
    } catch (healthError) {
      console.warn('Health check error:', healthError);
    }
    
    const response = await fetch(autoSelectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Cron-Job',
      },
    });

    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    console.log('Response status:', response.status);
    
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('Received HTML response instead of JSON:', htmlText.substring(0, 500));
      throw new Error(`Auto-select endpoint returned HTML instead of JSON. Status: ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      const responseText = await response.text();
      console.error('Failed to parse response as JSON:', responseText.substring(0, 500));
      throw new Error(`Invalid JSON response from auto-select endpoint: ${parseError}`);
    }
    
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

// Also support POST method for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}