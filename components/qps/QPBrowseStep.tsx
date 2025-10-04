'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ArrowLeft, Library, FolderOpen, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QPBrowseStepType } from './QPBrowseFlow'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface QPBrowseData {
  department?: string
  year?: string
  semester?: string
  subject?: SubjectItem
}

interface QPBrowseStepProps {
  data: Partial<QPBrowseData>
  onNext: (data: Partial<QPBrowseData>) => void
  onBack: () => void
  currentStep: QPBrowseStepType
}

export function QPBrowseStep({ data, onNext, onBack, currentStep }: QPBrowseStepProps) {
  const [departments, setDepartments] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)
  
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Initialize selected values based on current step and data
  useEffect(() => {
    if (currentStep === 'department') {
      setSelectedItem(data.department || '')
    } else if (currentStep === 'year') {
      setSelectedItem(data.year || '')
    } else if (currentStep === 'semester') {
      setSelectedItem(data.semester || '')
    } else if (currentStep === 'subject') {
      setSelectedSubject(data.subject || null)
    }
  }, [currentStep, data])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      if (currentStep === 'department') {
        const res = await fetch('/api/qps/departments', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch departments')
        setDepartments(json.departments)
      } else if (currentStep === 'year') {
        // Always fetch years when on year step, regardless of department selection
        const dept = data.department || 'IT' // fallback to IT
        const res = await fetch(`/api/qps/years?dept=${encodeURIComponent(dept)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch years')
        setYears(json.years)
      } else if (currentStep === 'semester') {
        // no fetch needed; semester is derived from year
      } else if (currentStep === 'subject') {
        if (!data.department || !data.year || !data.semester) {
          console.log('Missing data for subjects fetch:', { department: data.department, year: data.year, semester: data.semester })
          setError('Missing required data for fetching subjects')
          return
        }
        console.log('Fetching subjects for:', { department: data.department, year: data.year, semester: data.semester })
        const res = await fetch(`/api/qps/subjects?dept=${encodeURIComponent(data.department)}&year=${encodeURIComponent(data.year)}&semester=${encodeURIComponent(data.semester)}`, { cache: 'no-store' })
        const json = await res.json()
        console.log('Subjects API response:', json)
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch subjects')
        setSubjects(json.subjects)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [currentStep, data.department, data.year, data.semester])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNext = () => {
    if (currentStep === 'department' && selectedItem) {
      onNext({ department: selectedItem })
    } else if (currentStep === 'year' && selectedItem) {
      onNext({ year: selectedItem })
    } else if (currentStep === 'semester' && selectedItem) {
      onNext({ semester: selectedItem })
    } else if (currentStep === 'subject' && selectedSubject) {
      onNext({ subject: selectedSubject })
    } else {
      setError('Please make a selection')
    }
  }

  const getSemestersForYear = (year?: string) => {
    if (!year) return [] as string[]
    const y = year.toLowerCase()
    if (y.includes('1st')) return ['Semester 1', 'Semester 2']
    if (y.includes('2nd')) return ['Semester 3', 'Semester 4']
    if (y.includes('3rd')) return ['Semester 5', 'Semester 6']
    if (y.includes('4th')) return ['Semester 7', 'Semester 8']
    // generic fallback
    return ['Semester 1', 'Semester 2']
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 'department':
        return {
          title: 'Select Department',
          icon: FolderOpen,
          color: 'blue',
          stringItems: departments,
          selectedValue: selectedItem
        }
      case 'year':
        return {
          title: 'Select Academic Year',
          icon: BookOpen,
          color: 'green',
          stringItems: years,
          selectedValue: selectedItem
        }
      case 'semester':
        return {
          title: 'Select Semester',
          icon: BookOpen,
          color: 'indigo',
          stringItems: getSemestersForYear(data.year),
          selectedValue: selectedItem
        }
      case 'subject':
        return {
          title: 'Select Subject',
          icon: Library,
          color: 'purple',
          stringItems: [],
          selectedValue: selectedSubject?.code || ''
        }
      default:
        return {
          title: 'Select',
          icon: Library,
          color: 'blue',
          stringItems: [],
          selectedValue: ''
        }
    }
  }

  const stepInfo = getStepInfo()
  const IconComponent = stepInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-${stepInfo.color}-500 to-${stepInfo.color}-600 rounded-full mb-4`}>
          <IconComponent className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepInfo.title}</h2>
        <p className="text-gray-600">
          {currentStep === 'department' && 'Choose your department to continue'}
          {currentStep === 'year' && `Academic year for ${data.department || 'IT'}`}
          {currentStep === 'semester' && `Semester for ${data.department || 'IT'} - ${data.year || ''}`}
          {currentStep === 'subject' && `Subject for ${data.department || 'IT'} - ${data.year || ''}${data.semester ? ` - ${data.semester}` : ''}`}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Selection Card */}
      <div className="saas-card p-6">
        {loading ? (
          <div className="space-y-3">
            {currentStep === 'subject' ? (
              // Subject skeleton - full width cards
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-[var(--color-accent)] border border-[var(--color-border-light)]">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2 bg-[var(--color-border-light)]" />
                      <Skeleton className="h-3 w-32 bg-[var(--color-border-light)]" />
                    </div>
                    <Skeleton className="h-6 w-16 bg-[var(--color-border-light)]" />
                  </div>
                </div>
              ))
            ) : (
              // Department/Year skeleton - grid layout
              <div className={`grid gap-3 ${
                currentStep === 'department' ? 'grid-cols-1 sm:grid-cols-2' :
                (currentStep === 'year' || currentStep === 'semester') ? 'grid-cols-2 sm:grid-cols-3' :
                'grid-cols-1'
              }`}>
                {Array.from({ length: (currentStep === 'year' || currentStep === 'semester') ? 6 : 4 }).map((_, i) => (
                  <div key={i} className="h-16 w-full rounded-lg bg-[var(--color-accent)] border border-[var(--color-border-light)]">
                    <Skeleton className="h-full w-full rounded-lg bg-transparent" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`grid gap-3 ${
            currentStep === 'department' ? 'grid-cols-1 sm:grid-cols-2' :
            (currentStep === 'year' || currentStep === 'semester') ? 'grid-cols-2 sm:grid-cols-3' :
            'grid-cols-1'
          }`}>
            {currentStep === 'subject' ? (
              subjects.map((subject) => (
                <button
                  key={subject.code}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedSubject?.code === subject.code
                      ? `border-${stepInfo.color}-500 bg-${stepInfo.color}-50 text-${stepInfo.color}-900`
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium block">{subject.code}</span>
                      <span className="text-sm opacity-75">{subject.name}</span>
                    </div>
                
                  </div>
                </button>
              ))
            ) : (
              (stepInfo.stringItems || []).map((item: string) => (
                <button
                  key={item}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentStep === 'year' ? 'text-center' : 'text-left'
                  } ${
                    selectedItem === item
                      ? `border-${stepInfo.color}-500 bg-${stepInfo.color}-50 text-${stepInfo.color}-900`
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{item}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-2">📚 Study Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Review previous year papers to understand exam patterns</li>
          <li>• Practice time management with timed mock tests</li>
          <li>• Focus on frequently asked topics and question types</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {currentStep !== 'department' && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        
        <Button
          onClick={handleNext}
          disabled={(!selectedItem && !selectedSubject) || loading}
          className={`flex items-center gap-2 bg-gradient-to-r from-${stepInfo.color}-600 to-${stepInfo.color}-600 hover:from-${stepInfo.color}-700 hover:to-${stepInfo.color}-700 ${
            currentStep === 'department' ? 'ml-auto' : ''
          }`}
        >
          {currentStep === 'subject' ? 'View Papers' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
