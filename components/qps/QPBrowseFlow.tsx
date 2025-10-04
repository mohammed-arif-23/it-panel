'use client'

import { useState } from 'react'
import { QPBrowseStep } from './QPBrowseStep'
import { QPViewStep } from './QPViewStep'
 

export type QPBrowseStepType = 'department' | 'year' | 'semester' | 'subject' | 'papers'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface QPBrowseData {
  department: string
  year: string
  semester?: string
  subject: SubjectItem
}

interface QPBrowseFlowProps {
  onComplete?: (data: QPBrowseData) => void
}

export function QPBrowseFlow({ onComplete }: QPBrowseFlowProps) {
  const [currentStep, setCurrentStep] = useState<QPBrowseStepType>('department')
  const [browseData, setBrowseData] = useState<Partial<QPBrowseData>>({})

  const handleNext = (stepData: Partial<QPBrowseData>) => {
    let updatedData = { ...browseData, ...stepData }

    switch (currentStep) {
      case 'department':
        setBrowseData(updatedData)
        setCurrentStep('year')
        break
      case 'year':
        // Clear previously selected semester if year changed
        updatedData = { ...updatedData, semester: undefined, subject: undefined }
        setBrowseData(updatedData)
        setCurrentStep('semester')
        break
      case 'semester':
        setBrowseData(updatedData)
        setCurrentStep('subject')
        break
      case 'subject':
        setBrowseData(updatedData)
        setCurrentStep('papers')
        break
      case 'papers':
        onComplete?.(updatedData as QPBrowseData)
        break
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'year':
        setCurrentStep('department')
        break
      case 'semester':
        setCurrentStep('year')
        break
      case 'subject':
        setCurrentStep('semester')
        break
      case 'papers':
        setCurrentStep('subject')
        break
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'department':
      case 'year':
      case 'semester':
      case 'subject':
        return (
          <QPBrowseStep
            data={browseData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
          />
        )
      case 'papers':
        return (
          <QPViewStep
            data={browseData as QPBrowseData}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {renderCurrentStep()}
    </div>
  )
}
