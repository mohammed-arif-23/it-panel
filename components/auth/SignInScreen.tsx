'use client'

import { useState, useCallback } from 'react'
import { Search, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { useDebounce } from '@/hooks/useDebounce'
import Loader from '@/components/ui/loader'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
  password?: string | null
}

interface SignInScreenProps {
  onNext: (userData: any) => void
  onForgotPassword: () => void
  onBack: () => void
}

export function SignInScreen({ onNext, onForgotPassword, onBack }: SignInScreenProps) {
  const { login } = useAuth()
  const [studentSearch, setStudentSearch] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedSearch = useDebounce(studentSearch, 300)
  const { data: students = [], isLoading: isSearching } = useStudentSearch(debouncedSearch)

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student)
    setStudentSearch(`${student.name} (${student.register_number})`)
    setShowDropdown(false)
    setError('')
  }, [])

  const handleSignIn = async () => {
    if (!selectedStudent) {
      setError('Please select a student')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await login(selectedStudent.register_number, password || undefined)
      
      if (result.success) {
        onNext(selectedStudent)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = selectedStudent && (selectedStudent.password ? password : true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Welcome Back</h2>
        <p className="text-[var(--color-text-muted)]">Sign in to access your account</p>
      </div>

      {/* Sign In Form */}
      <div className="saas-card p-6 space-y-4">
        {/* Student Search */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Student Name or Register Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setShowDropdown(true)
                setSelectedStudent(null)
                setPassword('')
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type your name or register number"
              className="saas-input pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          </div>

          {/* Student Dropdown */}
          {showDropdown && (studentSearch.length >= 2 || students.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-[var(--color-background)] border border-[var(--color-border-light)] rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <div className="w-4 h-4 mr-2">
                    <Loader />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">Searching...</span>
                </div>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 hover:bg-[var(--color-accent)] cursor-pointer border-b border-[var(--color-border-light)] last:border-b-0 transition-colors"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium text-[var(--color-text-primary)]">{student.name}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">
                      {student.register_number} • {student.class_year}
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

        {/* Selected Student & Password */}
        {selectedStudent && (
          <div className="space-y-4 p-4 bg-[var(--color-accent)] rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">{selectedStudent.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {selectedStudent.register_number} • {selectedStudent.class_year}
                </p>
              </div>
            </div>

            {selectedStudent.password ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="saas-input pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[var(--color-warning)] bg-opacity-10 border border-[var(--color-warning)] border-opacity-20 rounded-lg">
                <p className="text-sm text-[var(--color-warning)]">
                  No password set. You'll be prompted to create one after signing in.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-[var(--color-error)] bg-opacity-10 border border-[var(--color-error)] border-opacity-20 rounded-lg">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleSignIn}
          disabled={!isFormValid || isLoading}
          className="saas-button-primary w-full ripple"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4">
                <Loader />
              </div>
              <span>Signing In...</span>
            </div>
          ) : (
            'Sign In Now'
          )}
        </Button>

        <button
          onClick={onForgotPassword}
          className="w-full text-center text-[var(--color-secondary)] hover:text-[var(--color-dark)] font-medium text-sm transition-colors"
        >
          Forgot Password?
        </button>
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Welcome</span>
        </button>
      </div>
    </div>
  )
}
