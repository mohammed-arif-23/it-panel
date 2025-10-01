'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { Button } from '../ui/button'
import Loader from '../ui/loader'
import { Search, User, ArrowLeft, CheckCircle } from 'lucide-react'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
  password?: string | null
}

interface RegisterNumberStepProps {
  onStudentSelect: (student: Student) => void
  onBack: () => void
}

export function RegisterNumberStep({ onStudentSelect, onBack }: RegisterNumberStepProps) {
  const [studentSearch, setStudentSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const debouncedSearch = useDebounce(studentSearch, 300)

  // Search students from API
  useEffect(() => {
    async function searchStudents() {
      if (debouncedSearch.length < 2) {
        setStudents([])
        return
      }
      
      setIsLoadingStudents(true)
      try {
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(debouncedSearch)}`)
        const data = await response.json()
        
        if (data.students) {
          setStudents(data.students)
        }
      } catch (error) {
        console.error('Failed to search students:', error)
      } finally {
        setIsLoadingStudents(false)
      }
    }
    
    searchStudents()
  }, [debouncedSearch])

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setStudentSearch(student.name)
    setShowStudentDropdown(false)
  }

  const handleContinue = () => {
    if (selectedStudent) {
      onStudentSelect(selectedStudent)
    }
  }

  return (
    <div className="saas-card p-6 slide-in-left">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-[var(--color-secondary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">Find Your Account</h2>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Search by Name or Register Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => {
                const value = e.target.value
                setStudentSearch(value)
                setShowStudentDropdown(true)
                setSelectedStudent(null)
              }}
              onFocus={() => setShowStudentDropdown(true)}
              placeholder="Search student..."
              className="saas-input glow-on-focus"
              autoFocus
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          </div>

          {/* Dropdown */}
          {showStudentDropdown && (studentSearch.length >= 2 || students.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-[var(--color-background)] border border-[var(--color-border-light)] rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {isLoadingStudents ? (
                <div className="flex items-center justify-center p-4">
                  <div className="w-8 h-8">
                    <Loader />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)] ml-2">Searching...</span>
                </div>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 hover:bg-[var(--color-accent)] cursor-pointer border-b border-[var(--color-border-light)] last:border-b-0 transition-colors"
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-[var(--color-secondary)]" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">
                          {student.register_number} • {student.class_year}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : studentSearch.length >= 2 ? (
                <div className="p-4 text-center text-[var(--color-text-muted)]">
                  <p className="text-sm">No students found</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Selected Student Confirmation */}
        {selectedStudent && (
          <div className="p-3 bg-[var(--color-accent)] rounded-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-primary)]">
                  {selectedStudent.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {selectedStudent.register_number} • {selectedStudent.class_year}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <Button 
          onClick={handleContinue}
          disabled={!selectedStudent}
          className="saas-button-primary w-full ripple scale-on-tap"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
