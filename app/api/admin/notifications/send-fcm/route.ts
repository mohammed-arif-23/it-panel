import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messaging } from '../../../../../lib/firebaseAdmin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { target, notification, userId } = await request.json();

    if (!notification?.title || !notification?.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get FCM tokens based on target
    let query = supabase
      .from('push_subscriptions')
      .select('fcm_token, user_id')
      .eq('platform', 'android')
      .not('fcm_token', 'is', null);

    if (target === 'user' && userId) {
      query = query.eq('user_id', userId);
    } else if (target === 'all') {
      // Send to all users
    }

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found', success: 0 },
        { status: 404 }
      );
    }

    const tokens = subscriptions
      .map(sub => sub.fcm_token)
      .filter(token => token != null) as string[];

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'No valid FCM tokens', success: 0 },
        { status: 404 }
      );
    }

    // Send via Firebase Cloud Messaging
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        url: notification.url || '/dashboard',
        clickAction: notification.url || '/dashboard',
      },
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'dynamit_main',
          sound: 'default',
          priority: 'high' as const,
        },
      },
    };

    // Send to multiple tokens
    const response = await messaging.sendEachForMulticast({
      tokens: tokens,
      ...message,
    });

    console.log('✅ FCM notifications sent:', {
      success: response.successCount,
      failure: response.failureCount,
    });

    // Log failures for debugging
    if (response.failureCount > 0) {
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          console.error(`❌ Failed to send to token ${idx}:`, resp.error);
          // Optionally: Remove invalid tokens from database
        }
      });
    }

    return NextResponse.json({
      success: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    });
  } catch (error: any) {
    console.error('❌ FCM notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
