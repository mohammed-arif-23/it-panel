'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/skeletons'
import { PullToRefresh } from '@/components/pwa/PullToRefresh'

type TimetableDay = {
  day: string
  periods: Array<{ time: string; subject: string; room?: string; teacher?: string }>
}

type TimetableRow = {
  id: string
  dept: string
  class: string
  json: any
  updated_at?: string
}

export default function TimetablePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [row, setRow] = useState<TimetableRow | null>(null)
  const [tick, setTick] = useState(0) // auto-refresh ticker for current period

  const fetchData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ class_year: user.class_year || '' })
      const res = await fetch(`/api/timetable?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to load timetable')
      } else {
        setRow(json.data)
      }
    } catch {
      setError('Network error while loading timetable')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router])

  const week = useMemo<TimetableDay[]>(() => {
    if (!row?.json) return []
    const j = row.json
    const timetable = j?.TIMETABLE || {}
    const hourSlots = j?.HOURS_SLOTS || {}
    const subjectDetails = j?.SUBJECT_DETAILS || {}

    const orderTimes: string[] = (() => {
      // Prefer HOURS_SLOTS numeric order (1..8) mapped to time strings
      const numericKeys = Object.keys(hourSlots).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b))
      const times = numericKeys.map(k => hourSlots[k]).filter(Boolean)
      if (times.length > 0) return times
      // Fallback: use the first day's keys order
      const firstDay = Object.values(timetable)[0] as Record<string,string> | undefined
      return firstDay ? Object.keys(firstDay) : []
    })()

    const daysOrder = ['MON','TUE','WED','THU','FRI','SAT']
    const buildSubjectLabel = (code: string) => {
      if (!code) return ''
      return code
    }

    return daysOrder
      .filter(d => timetable[d])
      .map((d) => {
        const dayObj = timetable[d] as Record<string,string>
        const periods = (orderTimes.length ? orderTimes : Object.keys(dayObj)).map((time) => ({
          time,
          subject: buildSubjectLabel(dayObj[time] || ''),
        }))
        return { day: d, periods }
      })
  }, [row, tick])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const { headers, currentKey, activeIndex, details, codes } = useMemo(() => {
    const j = row?.json || {}
    const hourSlots = j.HOURS_SLOTS || {}
    const timetable = j.TIMETABLE || {}
    const numericKeys = Object.keys(hourSlots).filter((k: string) => /^\d+$/.test(k)).sort((a: string,b: string)=>Number(a)-Number(b))
    const headers = numericKeys.map((k: string) => hourSlots[k]).filter(Boolean)
    const fallbackHeaders = Object.values(timetable)[0] ? Object.keys(Object.values(timetable)[0] as any) : []
    const finalHeaders: string[] = headers.length > 0 ? headers : fallbackHeaders

    // Determine current time key by checking now against each header range (12-hour or 24-hour like "9:30 AM - 10:20 AM" or "9.30 - 10.20")
    const parseTimeToMinutes = (t: string) => {
      const str = t.trim().toUpperCase()
      // Match 12-hour with optional AM/PM and either ':' or '.'
      const m = str.match(/^(\d{1,2})[\.:](\d{2})\s*(AM|PM)?$/)
      if (m) {
        let h = parseInt(m[1], 10)
        const min = parseInt(m[2], 10)
        const ap = m[3]
        if (ap === 'AM') {
          if (h === 12) h = 0
        } else if (ap === 'PM') {
          if (h !== 12) h += 12
        }
        return h * 60 + min
      }
      // Fallback: original "H.MM" without am/pm
      const [hStr, mm] = str.replace(':', '.').split('.')
      let h = parseInt(hStr || '0', 10)
      const min = parseInt(mm || '0', 10)
      // Map 1.xx-4.xx (no AM/PM) to afternoon hours 13-16 to align with college schedule
      if (h >= 1 && h <= 4) {
        h += 12
      }
      return h * 60 + min
    }
    const getMeridiem = (s: string): 'AM' | 'PM' | null => {
      const m = s.toUpperCase().match(/\b(AM|PM)\b/)
      return (m ? (m[1] as 'AM' | 'PM') : null)
    }

    const inRange = (now: Date, range: string) => {
      // Support '-', '–', '—'
      const parts = range.split(/[-–—]/).map(s => s.trim())
      const startRaw = parts[0]
      const endRaw = parts[1]
      if (!startRaw || !endRaw) return false

      // Inherit meridiem if only one side has AM/PM
      const sm = getMeridiem(startRaw)
      const em = getMeridiem(endRaw)
      const start = !sm && em ? `${startRaw} ${em}`.trim() : startRaw
      const end = !em && sm ? `${endRaw} ${sm}`.trim() : endRaw

      const minsNow = now.getHours() * 60 + now.getMinutes()
      const s = parseTimeToMinutes(start)
      const e = parseTimeToMinutes(end)
      // Limit highlighting strictly to college hours: 9:30 AM (570) to 4:30 PM (990)
      const collegeStart = 9 * 60 + 30
      const collegeEnd = 16 * 60 + 30
      if (minsNow < collegeStart || minsNow >= collegeEnd) return false
      return minsNow >= s && minsNow < e
    }
    const now = new Date()
    let foundIndex = -1
    const currentKey = finalHeaders.find((rng, idx) => {
      const ok = inRange(now, rng)
      if (ok && foundIndex === -1) foundIndex = idx
      return ok
    }) || ''

    const details = j.SUBJECT_DETAILS || {}
    const codes = Object.keys(details)
    return { headers: finalHeaders, currentKey, activeIndex: foundIndex, details, codes }
  }, [row])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-24 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-16" />
          </div>
        </div>
        <div className="p-4">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Timetable</h1>
          </div>
          <img src="/icons/android/android-launchericon-512-512.png" 
            className='w-12 h-12 p-0'
            alt="Logo"/>
        </div>
      </div>

      <PullToRefresh onRefresh={fetchData}>
        <div className="px-4 py-6">
        {isLoading ? (
          <div className="saas-card p-4">
            <div className="mb-3 h-5 w-24 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="saas-card p-6 border border-red-200 bg-red-50 text-red-800">
            {error}
          </div>
        ) : week.length === 0 ? (
          <div className="saas-card p-8 text-center">
            <div className="w-14 h-14 bg-[var(--color-accent)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7" style={{ color: 'var(--color-secondary)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>No timetable found</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Please check back later.</p>
          </div>
        ) : (
          <>
         
          <div className="saas-card p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="sticky top-0">
                  <th className="px-3 py-3 text-left font-semibold" style={{ color: 'var(--color-primary)', background: 'var(--color-background)' }}>Day</th>
                  {headers.map((t) => (
                    <th key={t} className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ color: 'var(--color-primary)', background: 'var(--color-background)' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {week.map((d) => {
                  // Determine current day code e.g., MON..SAT based on local time
                  const dayMap = ['SUN','MON','TUE','WED','THU','FRI','SAT'] as const
                  const todayCode = dayMap[new Date().getDay()]
                  const isToday = d.day === todayCode
                  return (
                    <tr key={d.day} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap" style={isToday ? { color: 'var(--color-primary)' } : { color: 'var(--color-text-primary)' }}>{d.day}</td>
                      {d.periods.map((p, idx) => {
                        const active = isToday && activeIndex === idx
                        return (
                          <td key={idx} className={`px-3 py-2 align-top ${active ? 'ring-2 ring-blue-300 rounded-md' : ''}`} style={active ? { background: 'var(--color-accent)' } : undefined}>
                            <div className="flex items-center gap-2">
                              <div className={`text-[13px] font-medium ${active ? 'text-blue-900' : ''}`} style={{ color: active ? undefined : 'var(--color-text-primary)' }}>
                                {p.subject || '-'}
                              </div>
                              {active && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600 text-white">Now</span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {activeIndex !== -1 && (
            <div className="mt-2 text-xs text-[var(--color-text-secondary)]">Current slot: <span className="font-semibold text-[var(--color-primary)]">{headers[activeIndex]}</span></div>
          )}
          {codes.length > 0 && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="saas-card p-4">
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Abbreviations</h3>
                <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {codes.map((c) => (
                    <div key={c} className="py-2 flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{c}</span>
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{details[c]?.Subject || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="saas-card p-4">
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Faculty Details</h3>
                <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {codes.map((c) => (
                    <div key={c} className="py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{c}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{details[c]?.Code || ''}</span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{details[c]?.Staff || ''}</div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}
        </>
      )}
      </div>
    </PullToRefresh>
  </div>
)
}

