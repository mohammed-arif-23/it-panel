import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const classYear = searchParams.get('class_year')

    if (!studentId || !classYear) {
      return NextResponse.json(
        { error: 'Missing student_id or class_year' },
        { status: 400 }
      )
    }

    // Get published notices for this student
    const { data: notices, error: noticesError } = await supabase
      .from('unified_notices')
      .select('id')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .or(`target_audience.eq.all,target_audience.eq.${classYear}`)

    if (noticesError) {
      console.error('Error fetching notices:', noticesError)
      return NextResponse.json(
        { error: 'Failed to fetch notices' },
        { status: 500 }
      )
    }

    const noticeIds = notices?.map(n => n.id) || []

    if (noticeIds.length === 0) {
      return NextResponse.json({ 
        total: 0,
        unread: 0,
        read: 0
      })
    }

    // Get viewed notices
    const { data: views, error: viewsError } = await supabase
      .from('unified_notice_views')
      .select('notice_id')
      .eq('student_id', studentId)
      .in('notice_id', noticeIds)

    if (viewsError) {
      console.error('Error fetching notice views:', viewsError)
      return NextResponse.json(
        { error: 'Failed to fetch notice views' },
        { status: 500 }
      )
    }

    const viewedNoticeIds = views?.map(v => v.notice_id) || []
    const unreadCount = noticeIds.length - viewedNoticeIds.length

    return NextResponse.json({
      total: noticeIds.length,
      unread: unreadCount,
      read: viewedNoticeIds.length
    })
  } catch (error) {
    console.error('Error in notice count endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
