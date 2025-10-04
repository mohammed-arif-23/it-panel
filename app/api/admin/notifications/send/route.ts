import { NextRequest, NextResponse } from 'next/server'
import { PushNotificationSender } from '@/lib/pushNotificationSender'

// Adjust to your admin panel origin(s) in production
const ALLOWED_ORIGINS = ['*'];

function withCors(body: any, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  const origin = (typeof body === 'object' && (body as any).__originOverride) || '*';
  res.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes('*') ? '*' : origin);
  res.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return withCors({ ok: true, __originOverride: origin });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      target, // 'student' | 'students' | 'class' | 'all' | 'category'
      targetValue, // studentId | studentIds[] | classYear | category
      notification 
    } = body

    // Validate required fields
    if (!target || !notification || !notification.title || !notification.body) {
      return withCors(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result = { success: 0, failed: 0 }

    switch (target) {
      case 'student':
        if (!targetValue) {
          return withCors(
            { error: 'Student ID is required' },
            { status: 400 }
          )
        }
        result = await PushNotificationSender.sendToStudent(
          targetValue,
          notification
        )
        break

      case 'students':
        if (!Array.isArray(targetValue) || targetValue.length === 0) {
          return withCors(
            { error: 'Student IDs array is required' },
            { status: 400 }
          )
        }
        result = await PushNotificationSender.sendToStudents(
          targetValue,
          notification
        )
        break

      case 'class':
        if (!targetValue) {
          return withCors(
            { error: 'Class year is required' },
            { status: 400 }
          )
        }
        result = await PushNotificationSender.sendToClass(
          targetValue,
          notification
        )
        break

      case 'all':
        result = await PushNotificationSender.sendToAll(notification)
        break

      case 'category':
        if (!targetValue || !targetValue.category) {
          return NextResponse.json(
            { error: 'Category is required' },
            { status: 400 }
          )
        }
        result = await PushNotificationSender.sendByCategory(
          targetValue.category,
          notification,
          targetValue.classYear
        )
        break

      default:
        return withCors(
          { error: 'Invalid target type. Must be: student, students, class, all, or category' },
          { status: 400 }
        )
    }

    return withCors({
      message: 'Notifications sent successfully',
      ...result,
      details: {
        target,
        targetValue,
        notification: {
          title: notification.title,
          body: notification.body
        }
      }
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return withCors(
      { 
        error: 'Failed to send notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check API status
export async function GET() {
  return withCors({
    status: 'ok',
    message: 'Push notification API is ready',
    endpoints: {
      POST: 'Send notifications',
      targets: ['student', 'students', 'class', 'all', 'category']
    }
  })
}
