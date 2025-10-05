import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, deviceType } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing userId or token' },
        { status: 400 }
      );
    }

    // Save to admin panel's FCM service
    const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/api/fcm/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        token,
        deviceType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save FCM token to admin service');
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token saved successfully'
    });
  } catch (error: any) {
    console.error('FCM subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
