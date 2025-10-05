import React from 'react'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'
import { DepartmentInfoView, DepartmentInfoData } from '@/components/DepartmentInfo'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Landmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

async function getDepartmentInfo(): Promise<DepartmentInfoData> {
  try {
    const res = await fetch(`/api/department-info`, {
      // Force dynamic fetch on server
      cache: 'no-store',
      // Next.js route handlers are same-origin; base url optional in prod
    })
    const json = await res.json()
    return (
      json.data || { vision: [], mission: [], staff: [] }
    )
  } catch {
    return { vision: [], mission: [], staff: [] }
  }
}

export default async function DepartmentInfoPage() {
  const data = await getDepartmentInfo()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Sticky Header copied and adapted from lab-manuals */}
      <div className="sticky top-0 z-40 bg-[var(--color-background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-background)]/80 border-b border-[var(--color-border-light)]">
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Department Info</h1>
          </div>
          <img src="/icons/android/android-launchericon-512-512.png" 
            className='w-12 h-12 p-0'
            alt="Logo"/>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 ">
        <header className="rounded-2xl bg-[var(--color-background)] border border-0 p-6 md:p-8 shadow-none">
          <h2 className="text-xl text-center md:text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-fuchsia-700">
            Department of Information Technology
          </h2>
        </header>

        <DepartmentInfoView data={data} />

        {/* Empty state handled inside DepartmentInfoView after client fetch */}
      </div>
    </div>
  )
}
