'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useResults, calculateGPA, getSemesterStatus, getGradeColor, useSubjectCredits } from '../../hooks/useResults'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import PageTransition from '../../components/ui/PageTransition'
import RedirectLoader from '../../components/ui/RedirectLoader'
import { SkeletonCard } from '../../components/ui/skeletons'
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Calendar,
  BookOpen,
  Award,
  BarChart3,
  Loader2,
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ResultsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null)

  // Fetch results data and subject credits - wait for authentication
  const isAuthReady = !loading && !!user
  const resultsQuery = useResults(user?.register_number || '', isAuthReady)
  const creditsQuery = useSubjectCredits()
  
  

  const handleRefresh = async () => {
    await resultsQuery.refetch()
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('Auth check - Loading:', loading, 'User:', !!user)
    if (!loading && !user) {
      console.log('Redirecting to login - no user found')
      router.push('/')
    }
  }, [user, loading, router])

  // Force authentication check after 5 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !user) {
        console.log('Authentication timeout - forcing redirect')
        router.push('/')
      }
    }, 5000)
    
    return () => clearTimeout(timeout)
  }, [loading, user, router])

  // Show login prompt if not authenticated after loading completes
  const showLoginPrompt = !loading && !user

  // Wait for authentication to complete
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-32 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} variant="wide" />
          ))}
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to login to view your results</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (resultsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-32 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} variant="wide" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return <RedirectLoader context="dashboard" />
  }

  if (resultsQuery.error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[var(--color-background)] pb-20">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
            <div className="flex items-center justify-between px-4 py-2">
              <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-bold text-[var(--color-primary)]">Results</h1>
              </div>
              <Image 
                src="/icons/android/android-launchericon-512-512.png" 
                alt="IT Department Logo" 
                width={48} 
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Error Loading Results</h2>
              <p className="text-[var(--color-text-secondary)] max-w-md">
                {resultsQuery.error?.message || 'Unable to load your exam results. Please try again later.'}
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-secondary)] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  const results = resultsQuery.data?.results || []
  const hasResults = results.length > 0
  const subjectCredits = creditsQuery.data

  // Calculate overall statistics
  const overallGPA = hasResults 
    ? Math.round((results.reduce((sum, result) => {
        const gpa = calculateGPA(result.student_data.res_data, subjectCredits, result.semester)
        return sum + gpa
      }, 0) / results.length) * 100) / 100
    : 0

  const totalSubjects = hasResults 
    ? results.reduce((sum, result) => sum + Object.keys(result.student_data.res_data).length, 0)
    : 0

  const passedSubjects = hasResults 
    ? results.reduce((sum, result) => {
        return sum + Object.values(result.student_data.res_data).filter(grade => !['U', 'UA'].includes(grade)).length
      }, 0)
    : 0

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition>
        <div className="min-h-screen bg-[var(--color-background)] pb-20">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
            <div className="flex items-center justify-between px-4 py-2">
              <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </Link>
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-bold text-[var(--color-primary)]">Results</h1>
              </div>
              <Image 
                src="/icons/android/android-launchericon-512-512.png" 
                alt="IT Department Logo" 
                width={48} 
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          <div className="p-4 space-y-6">
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <GraduationCap className="w-8 h-8 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">No Results Available</h2>
                  <p className="text-[var(--color-text-secondary)] max-w-md">
                    Your exam results haven't been published yet. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Student Info & Overall Stats */}
                <div className="saas-card p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-[var(--color-accent)] rounded-full">
                      <GraduationCap className="h-6 w-6 text-[var(--color-secondary)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-primary)]">{results[0]?.student_data.stu_name}</h2>
                      <p className="text-[var(--color-text-secondary)]">{user.register_number}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{results[0]?.department} - {results[0]?.batch}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-[var(--color-accent)]/30 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <BarChart3 className="h-5 w-5 text-[var(--color-secondary)]" />
                      </div>
                      <div className="text-2xl font-bold text-[var(--color-primary)]">{overallGPA}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">Overall GPA</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Trophy className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{results.length}</div>
                      <div className="text-sm text-green-700">Semesters</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{totalSubjects}</div>
                      <div className="text-sm text-blue-700">Total Subjects</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{passedSubjects}</div>
                      <div className="text-sm text-purple-700">Passed</div>
                    </div>
                  </div>
                </div>

                {/* Semester Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Semester Results</span>
                  </h3>

                  {results
                    .sort((a, b) => a.semester - b.semester) // Sort by semester number (1, 2, 3, 4...)
                    .map((result, index) => {
                    const semesterGPA = calculateGPA(result.student_data.res_data, subjectCredits, result.semester)
                    const status = getSemesterStatus(semesterGPA)
                    const subjects = Object.entries(result.student_data.res_data)
                    const isExpanded = selectedSemester === index

                    return (
                      <div key={result._id} className="saas-card overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-[var(--color-accent)]/20 transition-colors"
                          onClick={() => setSelectedSemester(isExpanded ? null : index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                                <TrendingUp className="h-5 w-5 text-[var(--color-secondary)]" />
                              </div>
                              <div>
                                <p className="font-semibold text-md text-[var(--color-primary)]">
                                  Semester {result.semester}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-[var(--color-primary)]">{semesterGPA}</div>
                              <div className={`text-sm font-medium ${status.color}`}>{status.status}</div>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-[var(--color-border-light)] p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {subjects.map(([subjectCode, grade]) => (
                                <div key={subjectCode} className="flex items-center justify-between p-3 bg-[var(--color-accent)]/30 rounded-lg">
                                  <span className="font-medium text-[var(--color-text-primary)]">{subjectCode}</span>
                                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade)}`}>
                                    {grade}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 text-xs text-[var(--color-text-muted)]">
                              Last updated: {new Date(result.last_updated).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </PageTransition>
    </PullToRefresh>
  )
}
