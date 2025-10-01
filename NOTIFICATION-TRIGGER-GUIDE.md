# Push Notification Trigger Guide

## 🔔 How to Send Push Notifications from Admin Panel

This guide shows you how to trigger push notifications automatically or manually from your admin panel.

---

## 📊 Current Setup

Your IT Panel already has:
- ✅ Client-side notification service (`lib/notificationService.ts`)
- ✅ Subscription management API (`/api/notifications/subscribe`)
- ✅ Database table for storing subscriptions
- ✅ Service worker for receiving notifications

**What's Missing**: Backend notification sending capability

---

## 🚀 Implementation Steps

### Step 1: Install Required Package

```bash
npm install web-push
```

### Step 2: Generate VAPID Keys (One-time)

Create a script to generate VAPID keys:

```javascript
// scripts/generate-vapid-keys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:', vapidKeys.publicKey);
console.log('VAPID Private Key:', vapidKeys.privateKey);
console.log('\nAdd these to your .env file:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
```

Run it:
```bash
node scripts/generate-vapid-keys.js
```

Add the keys to `.env`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:mohammedarif2303@gmail.com
```

---

## 📁 Create Notification Sending Service

### File: `lib/pushNotificationSender.ts`

```typescript
// Server-side push notification sender
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Initialize Web Push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:mohammedarif2303@gmail.com'

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  url?: string
}

export class PushNotificationSender {
  /**
   * Send notification to a specific student
   */
  static async sendToStudent(
    studentId: string,
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get student's push subscriptions
      const { data: subscriptions, error } = await supabase
        .from('unified_push_subscriptions')
        .select('*')
        .eq('student_id', studentId)
        .eq('enabled', true)

      if (error || !subscriptions || subscriptions.length === 0) {
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notification to student:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification to multiple students
   */
  static async sendToStudents(
    studentIds: string[],
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all subscriptions for these students
      const { data: subscriptions, error } = await supabase
        .from('unified_push_subscriptions')
        .select('*')
        .in('student_id', studentIds)
        .eq('enabled', true)

      if (error || !subscriptions || subscriptions.length === 0) {
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to students:', error)
      return { success: 0, failed: studentIds.length }
    }
  }

  /**
   * Send notification to a class/year
   */
  static async sendToClass(
    classYear: string,
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all students in this class
      const { data: students, error: studentsError } = await supabase
        .from('unified_students')
        .select('id')
        .eq('class_year', classYear)

      if (studentsError || !students || students.length === 0) {
        return { success: 0, failed: 0 }
      }

      const studentIds = students.map(s => s.id)

      // Get all subscriptions for these students
      const { data: subscriptions, error } = await supabase
        .from('unified_push_subscriptions')
        .select('*')
        .in('student_id', studentIds)
        .eq('enabled', true)

      if (error || !subscriptions || subscriptions.length === 0) {
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to class:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification to all students
   */
  static async sendToAll(
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    try {
      // Get all active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('unified_push_subscriptions')
        .select('*')
        .eq('enabled', true)

      if (error || !subscriptions || subscriptions.length === 0) {
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications to all:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Send notification based on preferences
   */
  static async sendByCategory(
    category: 'assignments' | 'seminars' | 'fines' | 'cod' | 'general',
    notification: NotificationPayload,
    classYear?: string
  ): Promise<{ success: number; failed: number }> {
    try {
      let query = supabase
        .from('unified_push_subscriptions')
        .select('*')
        .eq('enabled', true)
        .eq(`preferences->${category}`, true)

      // Filter by class if provided
      if (classYear) {
        const { data: students } = await supabase
          .from('unified_students')
          .select('id')
          .eq('class_year', classYear)

        if (students && students.length > 0) {
          const studentIds = students.map(s => s.id)
          query = query.in('student_id', studentIds)
        }
      }

      const { data: subscriptions, error } = await query

      if (error || !subscriptions || subscriptions.length === 0) {
        return { success: 0, failed: 0 }
      }

      return await this.sendToSubscriptions(subscriptions, notification)
    } catch (error) {
      console.error('Error sending notifications by category:', error)
      return { success: 0, failed: 1 }
    }
  }

  /**
   * Core method to send notifications to subscriptions
   */
  private static async sendToSubscriptions(
    subscriptions: any[],
    notification: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0
    let failedCount = 0

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-192x192.png',
      tag: notification.tag || 'notification',
      data: {
        ...notification.data,
        url: notification.url || '/dashboard',
        timestamp: Date.now()
      }
    })

    // Send to all subscriptions in parallel (with rate limiting)
    const batchSize = 100 // Send 100 at a time
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.subscription, payload)
            successCount++
          } catch (error: any) {
            failedCount++
            
            // Remove invalid subscriptions (410 = gone, 404 = not found)
            if (error.statusCode === 410 || error.statusCode === 404) {
              await supabase
                .from('unified_push_subscriptions')
                .delete()
                .eq('id', sub.id)
            }
            
            console.error(`Failed to send to subscription ${sub.id}:`, error.message)
          }
        })
      )
    }

    return { success: successCount, failed: failedCount }
  }
}
```

---

## 🔌 Create API Endpoints

### 1. Manual Notification Endpoint

**File**: `app/api/admin/notifications/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PushNotificationSender } from '@/lib/pushNotificationSender'

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result = { success: 0, failed: 0 }

    switch (target) {
      case 'student':
        result = await PushNotificationSender.sendToStudent(
          targetValue,
          notification
        )
        break

      case 'students':
        result = await PushNotificationSender.sendToStudents(
          targetValue,
          notification
        )
        break

      case 'class':
        result = await PushNotificationSender.sendToClass(
          targetValue,
          notification
        )
        break

      case 'all':
        result = await PushNotificationSender.sendToAll(notification)
        break

      case 'category':
        result = await PushNotificationSender.sendByCategory(
          targetValue.category,
          notification,
          targetValue.classYear
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid target type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: 'Notifications sent successfully',
      ...result
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
```

---

## 🤖 Automatic Notification Triggers

### 1. New Assignment Notification

Add to your assignment creation API:

```typescript
// After creating assignment
import { PushNotificationSender } from '@/lib/pushNotificationSender'

// Send notification to class
await PushNotificationSender.sendByCategory(
  'assignments',
  {
    title: '📝 New Assignment',
    body: `${assignmentData.title} - Due: ${formatDate(assignmentData.due_date)}`,
    icon: '/icon-192x192.png',
    tag: `assignment-${newAssignment.id}`,
    url: '/assignments',
    data: {
      type: 'assignment',
      assignmentId: newAssignment.id
    }
  },
  assignmentData.class_year
)
```

### 2. Seminar Selection Notification

Add to seminar selection logic:

```typescript
// After selecting student for seminar
await PushNotificationSender.sendToStudent(
  selectedStudent.id,
  {
    title: '🎤 You\'ve Been Selected!',
    body: `You're selected for seminar on ${formatDate(seminarDate)}`,
    icon: '/icon-192x192.png',
    tag: 'seminar-selection',
    url: '/seminar',
    data: {
      type: 'seminar',
      date: seminarDate
    }
  }
)
```

### 3. COD Selection Notification

```typescript
// After COD selection
await PushNotificationSender.sendToStudent(
  selectedStudent.id,
  {
    title: '💡 COD Selected!',
    body: `Present your Concept of the Day on ${formatDate(codDate)}`,
    icon: '/icon-192x192.png',
    tag: 'cod-selection',
    url: '/COD',
    data: {
      type: 'cod',
      date: codDate
    }
  }
)
```

### 4. Fine Added Notification

```typescript
// After adding fine
await PushNotificationSender.sendToStudent(
  studentId,
  {
    title: '💰 Fine Added',
    body: `₹${amount} fine for ${reason}`,
    icon: '/icon-192x192.png',
    tag: 'fine-added',
    url: '/fines',
    data: {
      type: 'fine',
      amount,
      reason
    }
  }
)
```

### 5. Notice Published Notification

```typescript
// After publishing notice
const targetStudents = notice.target_audience === 'all' 
  ? await PushNotificationSender.sendToAll(...)
  : await PushNotificationSender.sendToClass(notice.target_audience, ...)

await targetStudents({
  title: `📢 ${notice.priority === 'urgent' ? '🚨 URGENT: ' : ''}${notice.title}`,
  body: notice.content.substring(0, 100) + '...',
  icon: '/icon-192x192.png',
  tag: `notice-${notice.id}`,
  url: '/notice',
  data: {
    type: 'notice',
    noticeId: notice.id,
    priority: notice.priority
  }
})
```

---

## 🎛️ Admin Panel Integration

### Simple Admin Form to Send Notifications

```typescript
'use client'

import { useState } from 'react'

export default function SendNotificationForm() {
  const [target, setTarget] = useState('class')
  const [classYear, setClassYear] = useState('IT-A')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          targetValue: target === 'class' ? classYear : undefined,
          notification: {
            title,
            body,
            url: '/dashboard'
          }
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Send Push Notification</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Target</label>
          <select 
            value={target} 
            onChange={(e) => setTarget(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="class">Class</option>
            <option value="all">All Students</option>
          </select>
        </div>

        {target === 'class' && (
          <div>
            <label className="block font-medium mb-2">Class Year</label>
            <select 
              value={classYear} 
              onChange={(e) => setClassYear(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="IT-A">IT-A</option>
              <option value="IT-B">IT-B</option>
              <option value="IT-C">IT-C</option>
            </select>
          </div>
        )}

        <div>
          <label className="block font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Notification title"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Notification message"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title || !body}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>

        {result && (
          <div className={`p-4 rounded ${result.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {result.error ? (
              <p>Error: {result.error}</p>
            ) : (
              <p>
                ✅ Sent successfully!<br/>
                Success: {result.success} | Failed: {result.failed}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 📊 Usage Examples

### Example 1: Send to Single Student
```typescript
const result = await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target: 'student',
    targetValue: 'student-uuid-here',
    notification: {
      title: '📝 Assignment Graded',
      body: 'Your assignment has been graded. Check now!',
      url: '/assignments'
    }
  })
})
```

### Example 2: Send to Entire Class
```typescript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    target: 'class',
    targetValue: 'IT-A',
    notification: {
      title: '🎉 Class Announcement',
      body: 'Important update for IT-A students',
      url: '/dashboard'
    }
  })
})
```

### Example 3: Send to All Students
```typescript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    target: 'all',
    notification: {
      title: '🚨 College Holiday',
      body: 'College will remain closed tomorrow',
      url: '/notices'
    }
  })
})
```

---

## 🔐 Security Considerations

1. **Protect Admin Endpoints**: Add authentication middleware
```typescript
// middleware to check if user is admin
if (user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

2. **Rate Limiting**: Prevent notification spam
3. **Validate Inputs**: Always validate notification content
4. **Log All Sends**: Keep track of who sent what

---

## ✅ Quick Setup Checklist

- [ ] Install `web-push` package
- [ ] Generate VAPID keys
- [ ] Add keys to `.env`
- [ ] Create `pushNotificationSender.ts`
- [ ] Create `/api/admin/notifications/send` endpoint
- [ ] Add automatic triggers to existing APIs
- [ ] Create admin form for manual sends
- [ ] Test with a student account
- [ ] Add authentication/authorization

---

## 🎯 Summary

**Automatic Notifications**: Triggered by events (assignment created, selection made, etc.)
**Manual Notifications**: Sent from admin panel via API endpoint

Both use the same underlying `PushNotificationSender` service that handles:
- Fetching subscriptions from database
- Sending via web-push
- Cleaning up invalid subscriptions
- Returning success/failure counts

Your students already have the subscription system set up - you just need to add the sending capability! 🚀
