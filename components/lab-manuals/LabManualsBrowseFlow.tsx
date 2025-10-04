'use client'

import { useState } from 'react'
import { LabManualsBrowseStep } from './LabManualsBrowseStep'
import { LabManualsViewStep } from './LabManualsViewStep'
import { ArrowLeft } from 'lucide-react'

export type LabManualsBrowseStepType = 'department' | 'year' | 'semester' | 'subject' | 'manuals'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface LabManualsBrowseData {
  department: string
  year: string
  semester?: string
  subject: SubjectItem
}

interface LabManualsBrowseFlowProps {
  onComplete?: (data: LabManualsBrowseData) => void
}

export function LabManualsBrowseFlow({ onComplete }: LabManualsBrowseFlowProps) {
  const [currentStep, setCurrentStep] = useState<LabManualsBrowseStepType>('department')
  const [browseData, setBrowseData] = useState<Partial<LabManualsBrowseData>>({})

  const handleNext = (stepData: Partial<LabManualsBrowseData>) => {
    let updatedData = { ...browseData, ...stepData }

    switch (currentStep) {
      case 'department':
        setBrowseData(updatedData)
        setCurrentStep('year')
        break
      case 'year':
        // Clear previously selected semester and subject if year changed
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
        setCurrentStep('manuals')
        break
      case 'manuals':
        onComplete?.(updatedData as LabManualsBrowseData)
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
      case 'manuals':
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
          <LabManualsBrowseStep
            data={browseData}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={currentStep}
          />
        )
      case 'manuals':
        return (
          <LabManualsViewStep
            data={browseData as LabManualsBrowseData}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center space-x-3">
          {onComplete && (
            <button
              onClick={() => onComplete({} as LabManualsBrowseData)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-base font-semibold text-gray-900">Browse Lab Manuals</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        {renderCurrentStep()}
      </div>
    </div>
  )
}
