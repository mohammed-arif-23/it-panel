import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side read-only access is fine with service role; alternatively, use anon if RLS permits
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Prefer anon key for public read (policy already added). Fallback to service role if anon is missing.
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('department_info')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Fetch department_info error:', error)
      return NextResponse.json({ error: 'Failed to fetch department info' }, { status: 500 })
    }

    const normalized = data
      ? {
          ...data,
          vision: Array.isArray((data as any).vision)
            ? (data as any).vision
            : (data as any).vision
            ? [(data as any).vision]
            : [],
          mission: Array.isArray((data as any).mission)
            ? (data as any).mission
            : (data as any).mission
            ? [(data as any).mission]
            : [],
        }
      : { id: 'default', vision: [], mission: [], staff: [], updated_at: null }

    return NextResponse.json({ success: true, data: normalized })
  } catch (err) {
    console.error('GET /api/department-info error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
