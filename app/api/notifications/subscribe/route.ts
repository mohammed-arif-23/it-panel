import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validate env vars and fail fast with descriptive errors
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[subscribe] Missing Supabase env vars', {
    hasUrl: !!SUPABASE_URL,
    hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY
  })
}

const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { subscription, userId, fcmToken, platform } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Determine what type of subscription this is
    const isAndroid = platform === 'android' || fcmToken;
    
    const subscriptionData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
      platform: isAndroid ? 'android' : 'web'
    };

    if (fcmToken) {
      // Android FCM token
      subscriptionData.fcm_token = fcmToken;
      subscriptionData.subscription = null; // Clear web push subscription
    } else if (subscription) {
      // Web push subscription
      subscriptionData.subscription = subscription;
      subscriptionData.fcm_token = null; // Clear FCM token
    } else {
      return NextResponse.json(
        { error: 'Either subscription or fcmToken is required' },
        { status: 400 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Supabase credentials missing' },
        { status: 500 }
      )
    }

    // Store subscription in database (unique per user + platform)
    // First check if subscription exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', subscriptionData.platform)
      .single();

    let error;
    if (existing) {
      // Update existing subscription
      const result = await supabase
        .from('push_subscriptions')
        .update(subscriptionData)
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Insert new subscription
      const result = await supabase
        .from('push_subscriptions')
        .insert(subscriptionData);
      error = result.error;
    }

    if (error) {
      console.error('Error storing subscription:', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code
      })
      return NextResponse.json(
        { error: 'Failed to store subscription', code: (error as any).code, details: (error as any).message || (error as any).details },
        { status: 500 }
      )
    }

    console.log(`✅ ${isAndroid ? 'FCM' : 'Web push'} subscription saved for user ${userId}`);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in subscribe endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any)?.message },
      { status: 500 }
    )
  }
}
