'use client'

import { useState } from 'react'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { WelcomeScreen } from './WelcomeScreen'
import { SignInScreen } from './SignInScreen'
import { ForgotPasswordScreen } from './ForgotPasswordScreen'
import { CreatePasswordScreen } from './CreatePasswordScreen'
import { PasswordChangedScreen } from './PasswordChangedScreen'

export type AuthStep = 'welcome' | 'signin' | 'forgot' | 'create' | 'success'

interface AuthFlowProps {
  onComplete?: () => void
}

const authSteps = [
  { id: 1, title: 'Welcome', description: 'Get started' },
  { id: 2, title: 'Sign In', description: 'Enter details' },
  { id: 3, title: 'Verify', description: 'Confirm identity' },
  { id: 4, title: 'Complete', description: 'All set!' }
]

export function AuthFlow({ onComplete }: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome')
  const [userData, setUserData] = useState<any>(null)

  const getStepNumber = (step: AuthStep): number => {
    switch (step) {
      case 'welcome': return 1
      case 'signin': return 2
      case 'forgot': 
      case 'create': return 3
      case 'success': return 4
      default: return 1
    }
  }

  const handleStepChange = (step: AuthStep, data?: any) => {
    setCurrentStep(step)
    if (data) {
      setUserData(data)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen onNext={() => handleStepChange('signin')} />
      case 'signin':
        return (
          <SignInScreen
            onNext={(data) => handleStepChange('success', data)}
            onForgotPassword={() => handleStepChange('forgot')}
            onBack={() => handleStepChange('welcome')}
          />
        )
      case 'forgot':
        return (
          <ForgotPasswordScreen
            onNext={() => handleStepChange('create')}
            onBack={() => handleStepChange('signin')}
          />
        )
      case 'create':
        return (
          <CreatePasswordScreen
            onNext={() => handleStepChange('success')}
            onBack={() => handleStepChange('forgot')}
          />
        )
      case 'success':
        return (
          <PasswordChangedScreen
            onComplete={onComplete}
            userData={userData}
          />
        )
      default:
        return <WelcomeScreen onNext={() => handleStepChange('signin')} />
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] page-transition">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={authSteps}
          currentStep={getStepNumber(currentStep)}
          className="mb-8"
        />

        {/* Current Step Content */}
        <div className="fade-in">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}
