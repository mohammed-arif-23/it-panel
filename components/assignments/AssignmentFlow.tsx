'use client'

import { useState } from 'react'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { AssignmentDetailsStep } from './AssignmentDetailsStep'
import { AssignmentDescriptionStep } from './AssignmentDescriptionStep'
import { AssignmentScheduleStep } from './AssignmentScheduleStep'
import { AssignmentUploadStep } from './AssignmentUploadStep'
import { AssignmentConfirmationStep } from './AssignmentConfirmationStep'

export type AssignmentStep = 'details' | 'description' | 'schedule' | 'upload' | 'confirmation'

interface AssignmentData {
  title: string
  subject: string
  description: string
  instructions: string
  dueDate: string
  dueTime: string
  files: File[]
  priority: 'low' | 'medium' | 'high'
}

interface AssignmentFlowProps {
  onComplete?: (data: AssignmentData) => void
  onCancel?: () => void
}

const assignmentSteps = [
  { id: 1, title: 'Details', description: 'Basic info' },
  { id: 2, title: 'Description', description: 'Add details' },
  { id: 3, title: 'Schedule', description: 'Set deadline' },
  { id: 4, title: 'Upload', description: 'Add files' },
  { id: 5, title: 'Review', description: 'Confirm' }
]

export function AssignmentFlow({ onComplete, onCancel }: AssignmentFlowProps) {
  const [currentStep, setCurrentStep] = useState<AssignmentStep>('details')
  const [assignmentData, setAssignmentData] = useState<Partial<AssignmentData>>({
    priority: 'medium',
    files: []
  })

  const getStepNumber = (step: AssignmentStep): number => {
    switch (step) {
      case 'details': return 1
      case 'description': return 2
      case 'schedule': return 3
      case 'upload': return 4
      case 'confirmation': return 5
      default: return 1
    }
  }

  const handleStepChange = (step: AssignmentStep, data?: Partial<AssignmentData>) => {
    if (data) {
      setAssignmentData(prev => ({ ...prev, ...data }))
    }
    setCurrentStep(step)
  }

  const handleNext = (stepData: Partial<AssignmentData>) => {
    const updatedData = { ...assignmentData, ...stepData }
    setAssignmentData(updatedData)

    switch (currentStep) {
      case 'details':
        setCurrentStep('description')
        break
      case 'description':
        setCurrentStep('schedule')
        break
      case 'schedule':
        setCurrentStep('upload')
        break
      case 'upload':
        setCurrentStep('confirmation')
        break
      case 'confirmation':
        onComplete?.(updatedData as AssignmentData)
        break
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'description':
        setCurrentStep('details')
        break
      case 'schedule':
        setCurrentStep('description')
        break
      case 'upload':
        setCurrentStep('schedule')
        break
      case 'confirmation':
        setCurrentStep('upload')
        break
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'details':
        return (
          <AssignmentDetailsStep
            data={assignmentData}
            onNext={handleNext}
            onCancel={onCancel}
          />
        )
      case 'description':
        return (
          <AssignmentDescriptionStep
            data={assignmentData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 'schedule':
        return (
          <AssignmentScheduleStep
            data={assignmentData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 'upload':
        return (
          <AssignmentUploadStep
            data={assignmentData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 'confirmation':
        return (
          <AssignmentConfirmationStep
            data={assignmentData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] page-transition">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={assignmentSteps}
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
