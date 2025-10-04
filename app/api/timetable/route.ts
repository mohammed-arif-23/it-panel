import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/timetable?class_year=II-IT
// Returns timetable JSON for a given class_year from class_timetable (columns: id, dept, class, json)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classYear = searchParams.get('class_year')

    if (!classYear) {
      return NextResponse.json({ success: false, error: 'class_year is required' }, { status: 400 })
    }

    // Map possible values like 'III-IT' -> 'III YEAR' fallback to provided
    const mapToDisplayClass = (val: string) => {
      const prefix = val.split('-')[0].trim().toUpperCase()
      if (prefix === 'II') return 'II YEAR'
      if (prefix === 'III') return 'III YEAR'
      if (prefix === 'IV') return 'IV YEAR'
      return val
    }

    const displayClass = mapToDisplayClass(classYear)

    // Try fetch by exact class first, if not found, try by mapped display class
    let { data, error } = await supabase
      .from('class_timetable')
      .select('id, dept, class, json, updated_at')
      .eq('class', classYear)
      .single()

    if (error) {
      const tryMapped = await supabase
        .from('class_timetable')
        .select('id, dept, class, json, updated_at')
        .eq('class', displayClass)
        .single()
      data = tryMapped.data as any
      error = tryMapped.error as any
    }

    if (error || !data) {
      const status = (error as any)?.code === 'PGRST116' ? 404 : 404
      return NextResponse.json({ success: false, error: 'Timetable not found' }, { status })
    }

    const row = data as unknown as { id: string; dept: string; class: string; json: any; updated_at?: string }
    return NextResponse.json({ success: true, data: { id: row.id, dept: row.dept, class: row.class, json: row.json, updated_at: row.updated_at } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}
