'use client'

import { useState } from 'react'
import { ProgressIndicator } from '../ui/progress-indicator'
import { WelcomeStep } from './WelcomeStep'
import { RegisterNumberStep } from './RegisterNumberStep'
import { PasswordStep } from './PasswordStep'
import { LoginSuccessStep } from './LoginSuccessStep'
import { motion, AnimatePresence } from 'framer-motion'

export type LoginStep = 'welcome' | 'register' | 'password' | 'success'

interface Student {
  id: string
  name: string
  register_number: string
  class_year: string
  password?: string | null
}

interface ProgressiveLoginFlowProps {
  onLogin: (registerNumber: string, password?: string) => Promise<{ success: boolean; error?: string }>
}

const loginSteps = [
  { id: 1, title: 'Welcome', description: 'Get started' },
  { id: 2, title: 'Register', description: 'Find account' },
  { id: 3, title: 'Password', description: 'Enter password' },
  { id: 4, title: 'Success', description: 'Login complete' }
]

export function ProgressiveLoginFlow({ onLogin }: ProgressiveLoginFlowProps) {
  const [currentStep, setCurrentStep] = useState<LoginStep>('welcome')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [error, setError] = useState('')

  const getStepNumber = (step: LoginStep): number => {
    switch (step) {
      case 'welcome': return 1
      case 'register': return 2
      case 'password': return 3
      case 'success': return 4
      default: return 1
    }
  }

  const handleWelcomeContinue = () => {
    setCurrentStep('register')
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setCurrentStep('password')
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedStudent) return

    setError('')
    try {
      const result = await onLogin(selectedStudent.register_number, password)
      if (result.success) {
        setCurrentStep('success')
      } else {
        setError(result.error || 'Invalid password. Please try again.')
        throw new Error(result.error)
      }
    } catch (error) {
      setError('Invalid password. Please try again.')
      throw error
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'register':
        setCurrentStep('welcome')
        break
      case 'password':
        setCurrentStep('register')
        setSelectedStudent(null)
        break
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onContinue={handleWelcomeContinue} />
      case 'register':
        return (
          <RegisterNumberStep
            onStudentSelect={handleStudentSelect}
            onBack={handleBack}
          />
        )
      case 'password':
        return (
          <PasswordStep
            student={selectedStudent}
            onSubmit={handlePasswordSubmit}
            onBack={handleBack}
            error={error}
          />
        )
      case 'success':
        return <LoginSuccessStep student={selectedStudent} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' ? (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderCurrentStep()}
          </motion.div>
        ) : (
          <motion.div 
            key={currentStep}
            className="h-screen flex items-center justify-center px-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-md w-full">
              {renderCurrentStep()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
