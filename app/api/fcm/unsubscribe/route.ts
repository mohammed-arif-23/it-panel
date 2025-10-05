import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Missing userId or token' },
        { status: 400 }
      );
    }

    // Remove from admin panel's FCM service
    const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/api/fcm/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        token
      })
    });

    if (!response.ok) {
      console.warn('Failed to remove FCM token from admin service');
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token removed successfully'
    });
  } catch (error: any) {
    console.error('FCM unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
