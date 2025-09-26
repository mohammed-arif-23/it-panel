'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Student, StudentRegistration } from '@/types/database'
import { dbHelpers } from '@/lib/supabase'

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

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('unified_college_user')
        if (storedUser) {
          const userData = JSON.parse(storedUser) as Student
          const { data, error } = await dbHelpers.findStudentByRegNumber(userData.register_number)
          if (data && !error) {
            setUser(data as Student)
            const registrationsData = (data as any).unified_student_registrations || []
            setRegistrations(registrationsData)
          } else {
            localStorage.removeItem('unified_college_user')
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error)
        localStorage.removeItem('unified_college_user')
      } finally {
        setLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  const login = async (regNumber: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    
    try {
      if (!regNumber || regNumber.trim().length === 0) {
        return { success: false, error: 'Please enter your registration number' }
      }

      const trimmedRegNumber = regNumber.trim().toUpperCase()

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
          return { success: false, error: 'Invalid password.' }
        }
      } else if (studentWithPassword.password) {
        return { success: false, error: 'Password required for this account.' }
      }

      const registrationsData = (student as any).unified_student_registrations || []

      setUser(student as Student)
      setRegistrations(registrationsData)
      localStorage.setItem('unified_college_user', JSON.stringify(student))

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred. Please try again.' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setRegistrations([])
    localStorage.removeItem('unified_college_user')
  }

  const refreshUser = async () => {
    if (!user) return

    try {
      const { data, error } = await dbHelpers.findStudentByRegNumber(user.register_number)
      if (data && !error) {
        setUser(data as Student)
        localStorage.setItem('unified_college_user', JSON.stringify(data))
        
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}