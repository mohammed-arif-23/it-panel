# Admin Panel - Push Notification Feature Implementation Prompt

## 📋 Context

You are implementing a push notification management system for an educational admin panel. The backend notification infrastructure is already set up with:
- Push notification service (`lib/pushNotificationSender.ts`)
- API endpoint (`/api/admin/notifications/send`)
- Database tables for subscriptions and history
- VAPID keys configured

## 🎯 Goal

Create a comprehensive notification management interface in the admin panel that allows administrators to:
1. Send manual push notifications to students
2. View notification history
3. Monitor notification delivery statistics
4. Schedule notifications (optional)

## 🏗️ Required Features

### 1. **Send Notification Form**

Create a form with the following fields:

**Target Selection:**
- Radio buttons or dropdown for target type:
  - Single Student (search/select)
  - Multiple Students (multi-select)
  - Entire Class (IT-A, IT-B, IT-C, etc.)
  - All Students
  - By Category (assignments, seminars, fines, cod, general)

**Notification Content:**
- Title (required, max 50 chars)
- Message body (required, max 200 chars)
- Icon URL (optional, default: `/icon-192x192.png`)
- Action URL (optional, default: `/dashboard`)
- Tag (optional, for grouping)

**Additional Options:**
- Priority (low, medium, high, urgent)
- Category (for filtering by preferences)
- Schedule for later (optional)

### 2. **Notification History View**

Display a table/list showing:
- Notification title and body
- Target (who it was sent to)
- Timestamp
- Success/Failed count
- Status (sent, failed, scheduled)
- Action buttons (view details, resend)

**Filters:**
- Date range
- Target type
- Category
- Status

### 3. **Quick Actions Dashboard**

Pre-made notification templates for common scenarios:
- "Class Cancelled"
- "Assignment Reminder"
- "Exam Schedule Update"
- "Important Announcement"
- "Holiday Notice"

Each template should have:
- Pre-filled title and message
- Appropriate icon and category
- Quick send button

### 4. **Statistics Panel**

Show metrics:
- Total notifications sent (today/week/month)
- Delivery success rate
- Active subscriptions count
- Most recent notifications
- Category-wise breakdown

## 📁 Suggested File Structure

```
admin-panel/
├── pages/
│   └── notifications/
│       ├── send.tsx              # Main send notification page
│       ├── history.tsx           # Notification history
│       ├── templates.tsx         # Quick templates
│       └── statistics.tsx        # Analytics dashboard
├── components/
│   └── notifications/
│       ├── NotificationForm.tsx       # Main form
│       ├── TargetSelector.tsx         # Student/class selector
│       ├── NotificationPreview.tsx    # Preview before send
│       ├── NotificationHistory.tsx    # History table
│       ├── QuickTemplates.tsx         # Template cards
│       └── NotificationStats.tsx      # Statistics widgets
└── lib/
    └── notificationApi.ts             # API helper functions
```

## 🔌 API Integration

### Send Notification

```typescript
// Example API call
const response = await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target: 'class',
    targetValue: 'IT-A',
    notification: {
      title: '📢 Important Announcement',
      body: 'Classes are cancelled tomorrow due to holiday',
      url: '/notices',
      icon: '/icon-192x192.png',
      tag: 'announcement',
      data: {
        type: 'announcement',
        priority: 'high'
      }
    }
  })
})

const result = await response.json()
// { success: 45, failed: 2, message: "..." }
```

### Available Target Types

1. **Single Student**
   ```typescript
   {
     target: 'student',
     targetValue: 'student-uuid',
     notification: { ... }
   }
   ```

2. **Multiple Students**
   ```typescript
   {
     target: 'students',
     targetValue: ['uuid1', 'uuid2', 'uuid3'],
     notification: { ... }
   }
   ```

3. **Class**
   ```typescript
   {
     target: 'class',
     targetValue: 'IT-A',
     notification: { ... }
   }
   ```

4. **All Students**
   ```typescript
   {
     target: 'all',
     notification: { ... }
   }
   ```

5. **By Category with Preferences**
   ```typescript
   {
     target: 'category',
     targetValue: {
       category: 'assignments',
       classYear: 'IT-A' // optional
     },
     notification: { ... }
   }
   ```

## 🎨 UI/UX Requirements

### Design Guidelines

1. **Visual Hierarchy:**
   - Clear separation between form sections
   - Prominent "Send" button
   - Preview area showing how notification will appear

2. **Feedback:**
   - Loading state while sending
   - Success/error messages
   - Confirmation dialog for bulk sends
   - Real-time character counter

3. **Validation:**
   - Required field indicators
   - Character limits
   - Target validation (at least one recipient)

4. **Accessibility:**
   - Keyboard navigation
   - ARIA labels
   - Error messages for screen readers

### Color Coding

- 🔴 Urgent/High Priority: Red accents
- 🟠 Medium Priority: Orange accents
- 🔵 Low Priority: Blue accents
- 🟢 Success: Green indicators
- ⚫ General: Default theme

## 📊 Notification Templates

### Template Structure

```typescript
interface NotificationTemplate {
  id: string
  title: string
  body: string
  category: string
  icon: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  defaultTarget: string
  color: string
}

// Example templates
const templates = [
  {
    id: 'class-cancelled',
    title: '❌ Class Cancelled',
    body: 'Classes for [subject] are cancelled today',
    category: 'general',
    icon: '/icons/cancel.png',
    priority: 'high',
    defaultTarget: 'class',
    color: 'red'
  },
  {
    id: 'assignment-reminder',
    title: '📝 Assignment Due Soon',
    body: 'Reminder: [assignment] is due in 24 hours',
    category: 'assignments',
    icon: '/icons/assignment.png',
    priority: 'medium',
    defaultTarget: 'category',
    color: 'blue'
  },
  {
    id: 'exam-schedule',
    title: '📅 Exam Schedule Update',
    body: 'Exam schedule has been updated. Check now!',
    category: 'general',
    icon: '/icons/exam.png',
    priority: 'high',
    defaultTarget: 'all',
    color: 'orange'
  }
]
```

## 🔒 Security Considerations

1. **Authentication:**
   - Verify admin role before accessing
   - Use middleware to protect routes
   
2. **Authorization:**
   - Only admins can send notifications
   - Log all notification sends with admin ID

3. **Rate Limiting:**
   - Prevent spam/abuse
   - Limit bulk sends per hour

4. **Input Validation:**
   - Sanitize all inputs
   - Validate URLs
   - Check for malicious content

## 📱 Responsive Design

- **Desktop:** Full form with sidebar preview
- **Tablet:** Stacked layout with collapsible preview
- **Mobile:** Single column with bottom preview drawer

## 🧪 Testing Checklist

- [ ] Send to single student
- [ ] Send to multiple students
- [ ] Send to class
- [ ] Send to all students
- [ ] Send by category (with preferences)
- [ ] Character limit validation
- [ ] Required field validation
- [ ] Success/error handling
- [ ] Template quick send
- [ ] History view and filters
- [ ] Statistics accuracy
- [ ] Responsive design
- [ ] Loading states
- [ ] Confirmation dialogs

## 🚀 Advanced Features (Optional)

1. **Scheduled Notifications:**
   - Date/time picker
   - Store in database
   - Cron job to send at scheduled time

2. **Rich Notifications:**
   - Add images
   - Action buttons
   - Sound options

3. **A/B Testing:**
   - Send different versions to test engagement
   - Track click-through rates

4. **Analytics:**
   - Open rates
   - Click rates
   - Most effective notification times
   - User engagement metrics

## 🎯 Implementation Priority

### Phase 1 (Essential - Implement First)
1. Basic send notification form
2. Target selection (student, class, all)
3. API integration
4. Success/error feedback

### Phase 2 (Important)
1. Notification history view
2. Basic templates
3. Statistics dashboard

### Phase 3 (Nice to Have)
1. Scheduled notifications
2. Advanced analytics
3. Rich media support

## 📞 Sample API Helper

```typescript
// lib/notificationApi.ts

export const notificationApi = {
  async sendNotification(data: {
    target: string
    targetValue: any
    notification: {
      title: string
      body: string
      url?: string
      icon?: string
      tag?: string
    }
  }) {
    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to send notification')
    }
    
    return response.json()
  },

  async getHistory(filters?: {
    startDate?: string
    endDate?: string
    target?: string
  }) {
    const params = new URLSearchParams(filters as any)
    const response = await fetch(`/api/admin/notifications/history?${params}`)
    return response.json()
  },

  async getStatistics() {
    const response = await fetch('/api/admin/notifications/statistics')
    return response.json()
  }
}
```

## ✅ Acceptance Criteria

The implementation is complete when:
1. ✅ Admin can send notifications to any target type
2. ✅ Real-time feedback on send status
3. ✅ Notification history is visible and filterable
4. ✅ Quick templates work correctly
5. ✅ Statistics show accurate data
6. ✅ Mobile responsive
7. ✅ Error handling works
8. ✅ All security measures implemented

## 🎨 UI Component Examples

### Notification Form Layout

```
┌──────────────────────────────────────┐
│  Send Push Notification              │
├──────────────────────────────────────┤
│                                      │
│  Target: ○ Student  ● Class  ○ All  │
│  ┌────────────────────────────────┐ │
│  │ Select Class: IT-A ▼          │ │
│  └────────────────────────────────┘ │
│                                      │
│  Title: ┌───────────────────────┐  │
│         │ 📢 Important Update   │  │
│         └───────────────────────┘  │
│         48/50 characters            │
│                                      │
│  Message: ┌─────────────────────┐  │
│           │ Classes are          │  │
│           │ cancelled tomorrow   │  │
│           └─────────────────────┘  │
│           35/200 characters         │
│                                      │
│  Priority: [High ▼]                 │
│  Category: [General ▼]              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │    Send Notification    →      │ │
│  └────────────────────────────────┘ │
│                                      │
│  Preview:                            │
│  ┌────────────────────────────────┐ │
│  │ 📢 Important Update            │ │
│  │ Classes are cancelled tomorrow │ │
│  │ DynamIT • now                  │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 🎯 Final Notes

- Use your existing design system and components
- Match the admin panel's theme and styling
- Ensure consistency with other admin features
- Test thoroughly before deploying
- Document any custom configurations

---

**This prompt provides everything needed to implement a complete, production-ready push notification management system in your admin panel!** 🚀
