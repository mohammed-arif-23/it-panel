'use client'

import { useState } from 'react'
 

export type NotesBrowseStepType = 'department' | 'year' | 'semester' | 'subject' | 'notes'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface NotesBrowseData {
  department?: string
  year?: string
  semester?: string
  subject?: SubjectItem
}

interface NotesBrowseFlowProps {
  onClose?: () => void
}

export function NotesBrowseFlow({ onClose }: NotesBrowseFlowProps) {
  const [currentStep, setCurrentStep] = useState<NotesBrowseStepType>('department')
  const [data, setData] = useState<Partial<NotesBrowseData>>({})

  const handleNext = (stepData: Partial<NotesBrowseData>) => {
    let updatedData = { ...data, ...stepData }

    switch (currentStep) {
      case 'department':
        setData(updatedData)
        setCurrentStep('year')
        break
      case 'year':
        // Clear previously selected semester and subject if year changed
        updatedData = { ...updatedData, semester: undefined, subject: undefined }
        setData(updatedData)
        setCurrentStep('semester')
        break
      case 'semester':
        setData(updatedData)
        setCurrentStep('subject')
        break
      case 'subject':
        setData(updatedData)
        setCurrentStep('notes')
        break
    }
  }

  const handleBack = () => {
    if (currentStep === 'year') {
      setCurrentStep('department')
    } else if (currentStep === 'semester') {
      setCurrentStep('year')
    } else if (currentStep === 'subject') {
      setCurrentStep('semester')
    } else if (currentStep === 'notes') {
      setCurrentStep('subject')
    }
  }

  const handleReset = () => {
    setCurrentStep('department')
    setData({})
  }

  if (currentStep === 'notes' && data.department && data.year && data.semester && data.subject) {
    const { NotesBrowseStep } = require('./NotesBrowseStep')
    const { NotesViewStep } = require('./NotesViewStep')
    
    return (
      <NotesViewStep
        data={{
          department: data.department,
          year: data.year,
          semester: data.semester,
          subject: data.subject
        }}
        onBack={handleBack}
      />
    )
  }

  const { NotesBrowseStep } = require('./NotesBrowseStep')
  
  return (
    <div className="max-w-2xl mx-auto p-4">

        <NotesBrowseStep
          data={data}
          onNext={handleNext}
          onBack={handleBack}
          currentStep={currentStep}
        />


    </div>
  )
}
