'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Student, StudentRegistration } from '@/types/database'
import { dbHelpers } from '@/lib/supabase'
import { safeLocalStorage } from '@/lib/localStorage'
import { loginRateLimiter } from '@/lib/rateLimiter'

// Extended student type to include password
interface StudentWithPassword extends Student {
  password: string | null;
}

// Auth state interface
interface AuthState {
  user: Student | null
  loading: boolean
  registrations: StudentRegistration[]
}

interface AuthContextType extends AuthState {
  login: (regNumber: string, password?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  registerForService: (service: 'nptel' | 'seminar') => Promise<{ success: boolean; error?: string }>
  hasRegistration: (service: 'nptel' | 'seminar') => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Student | null>(null)
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // Generate new session token
  const generateSessionToken = (): string => {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(32)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    // Fallback for older browsers
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = safeLocalStorage.getItem('unified_college_user')
        const storedToken = safeLocalStorage.getItem('session_token')
        const sessionCreatedAt = safeLocalStorage.getItem('session_created_at')
        
        if (storedUser && storedToken) {
          // Check session age (expire after 30 days)
          if (sessionCreatedAt) {
            const ageInDays = (Date.now() - parseInt(sessionCreatedAt)) / (1000 * 60 * 60 * 24)
            if (ageInDays > 30) {
              // Session too old, require re-login
              safeLocalStorage.removeItem('unified_college_user')
              safeLocalStorage.removeItem('session_token')
              safeLocalStorage.removeItem('session_created_at')
              setAuthError('Session expired. Please login again.')
              setLoading(false)
              return
            }
          }
          
          const userData = JSON.parse(storedUser) as Student
          const { data, error } = await dbHelpers.findStudentByRegNumber(userData.register_number)
          if (data && !error) {
            setUser(data as Student)
            setSessionToken(storedToken)
            const registrationsData = (data as any).unified_student_registrations || []
            setRegistrations(registrationsData)
            setAuthError(null)
            // Ensure user_id is available for notifications subscription flows
            safeLocalStorage.setItem('user_id', (data as Student).id)
          } else {
            // Clear corrupted data and set error
            safeLocalStorage.removeItem('unified_college_user')
            safeLocalStorage.removeItem('session_token')
            safeLocalStorage.removeItem('session_created_at')
            setAuthError('Session expired. Please login again.')
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error)
        safeLocalStorage.removeItem('unified_college_user')
        safeLocalStorage.removeItem('session_token')
        safeLocalStorage.removeItem('session_created_at')
        setAuthError('Failed to load user session')
      } finally {
        setLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  const login = async (regNumber: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    // Do not toggle global loading during interactive login to avoid unmounting the login flow UI
    try {
      if (!regNumber || regNumber.trim().length === 0) {
        return { success: false, error: 'Please enter your registration number' }
      }

      const trimmedRegNumber = regNumber.trim().toUpperCase()
      
      // Check rate limiting
      const rateLimitCheck = loginRateLimiter.isRateLimited(trimmedRegNumber)
      if (rateLimitCheck.limited) {
        const minutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60)
        return { 
          success: false, 
          error: `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.` 
        }
      }

      let { data: student, error } = await dbHelpers.findStudentByRegNumber(trimmedRegNumber)

      if (error && error.code !== 'PGRST116') {
        console.error('Database error during login:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return { success: false, error: 'Database connection error. Please try again.' }
      }

      if (!student) {
        const createResult = await dbHelpers.createStudent(trimmedRegNumber)
        if (createResult.error) {
          console.error('Error creating student:', createResult.error)
          return { success: false, error: 'Unable to register student. Please try again.' }
        }
        student = createResult.data
      }

      if (!student) {
        return { success: false, error: 'Unable to process login. Please try again.' }
      }

      const studentWithPassword = student as StudentWithPassword;

      if (password) {
        if (!studentWithPassword.password) {
          const { error: updateError } = await dbHelpers.updateStudent(studentWithPassword.id, {
            password: password
          });
          
          if (updateError) {
            console.error('Error setting password:', updateError);
            return { success: false, error: 'Failed to set password. Please try again.' };
          }
          
          studentWithPassword.password = password;
        } 
        else if (studentWithPassword.password !== password) {
          // Record failed attempt for rate limiting
          loginRateLimiter.recordFailedAttempt(trimmedRegNumber)
          return { success: false, error: 'Invalid password.' }
        }
      } else if (studentWithPassword.password) {
        return { success: false, error: 'Password required for this account.' }
      }

      const registrationsData = (student as any).unified_student_registrations || []

      // SECURITY: Generate new session token on login (prevents session fixation)
      const newSessionToken = generateSessionToken()
      setSessionToken(newSessionToken)
      safeLocalStorage.setItem('session_token', newSessionToken)
      safeLocalStorage.setItem('session_created_at', Date.now().toString())
      
      setUser(student as Student)
      setRegistrations(registrationsData)
      setAuthError(null)
      safeLocalStorage.setItem('unified_college_user', JSON.stringify(student))
      // Persist user_id for notification services (web push & FCM)
      safeLocalStorage.setItem('user_id', (student as Student).id)
      
      // Clear rate limiting on successful login
      loginRateLimiter.clearAttempts(trimmedRegNumber)

      // Sync FCM token after login (if available)
      try {
        const { enhancedNotificationService } = await import('@/lib/enhancedNotificationService');
        await enhancedNotificationService.syncTokenAfterLogin();
      } catch (error) {
        console.warn('Failed to sync FCM token after login:', error);
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    setRegistrations([])
    setAuthError(null)
    setSessionToken(null)
    safeLocalStorage.removeItem('unified_college_user')
    safeLocalStorage.removeItem('session_token')
    safeLocalStorage.removeItem('session_created_at')
    safeLocalStorage.removeItem('user_id')
  }

  const refreshUser = async () => {
    if (!user) return

    try {
      const { data, error } = await dbHelpers.findStudentByRegNumber(user.register_number)
      if (data && !error) {
        setUser(data as Student)
        safeLocalStorage.setItem('unified_college_user', JSON.stringify(data))
        
        const registrationsData = (data as any).unified_student_registrations || []
        setRegistrations(registrationsData)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const registerForService = async (service: 'nptel' | 'seminar'): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not logged in' }
    }

    try {
      const existingRegistration = registrations.find(
        reg => reg.registration_type === service || reg.registration_type === 'both'
      )

      if (existingRegistration) {
        return { success: false, error: `Already registered for ${service}` }
      }

      const { data, error } = await dbHelpers.createRegistration(user.id, service)
      if (error) {
        console.error('Registration error:', error)
        return { success: false, error: 'Failed to register. Please try again.' }
      }

      if (data) {
        setRegistrations(prev => [...prev, data])
      }

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
  }

  const hasRegistration = (service: 'nptel' | 'seminar'): boolean => {
    return registrations.some(
      reg => reg.registration_type === service || reg.registration_type === 'both'
    )
  }

  const value: AuthContextType = {
    user,
    loading,
    registrations,
    login,
    logout,
    refreshUser,
    registerForService,
    hasRegistration
  }

  // Clear auth error when user successfully loads
  useEffect(() => {
    if (user && authError) {
      setAuthError(null)
    }
  }, [user, authError])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}