'use client'

import { useState } from 'react'
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssignmentData {
  description?: string
  instructions?: string
}

interface AssignmentDescriptionStepProps {
  data: Partial<AssignmentData>
  onNext: (data: Partial<AssignmentData>) => void
  onBack: () => void
}

export function AssignmentDescriptionStep({ data, onNext, onBack }: AssignmentDescriptionStepProps) {
  const [description, setDescription] = useState(data.description || '')
  const [instructions, setInstructions] = useState(data.instructions || '')

  const handleNext = () => {
    if (!description.trim()) return
    
    onNext({
      description: description.trim(),
      instructions: instructions.trim()
    })
  }

  const isFormValid = description.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Assignment Description</h2>
        <p className="text-[var(--color-text-muted)]">Provide detailed information about the assignment</p>
      </div>

      {/* Form */}
      <div className="saas-card p-6 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Assignment Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what students need to do for this assignment..."
            className="saas-input min-h-[120px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Explain the assignment objectives clearly</span>
            <span>{description.length}/500</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Special Instructions (Optional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Any specific requirements, formatting guidelines, or submission notes..."
            className="saas-input min-h-[100px] resize-none"
            maxLength={300}
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Additional guidelines for students</span>
            <span>{instructions.length}/300</span>
          </div>
        </div>

        {/* Example Templates */}
        <div className="space-y-3">
          <h4 className="font-medium text-[var(--color-text-secondary)]">Quick Templates:</h4>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setDescription('Complete the exercises from Chapter 5 and submit your solutions with detailed explanations.')}
              className="p-3 text-left bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-secondary)] hover:text-white transition-colors text-sm"
            >
              📚 Chapter Exercise Template
            </button>
            <button
              type="button"
              onClick={() => setDescription('Research and write a 1000-word essay on the given topic. Include proper citations and references.')}
              className="p-3 text-left bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-secondary)] hover:text-white transition-colors text-sm"
            >
              📝 Essay Assignment Template
            </button>
            <button
              type="button"
              onClick={() => setDescription('Create a presentation covering the key concepts discussed in class. Include examples and practical applications.')}
              className="p-3 text-left bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-secondary)] hover:text-white transition-colors text-sm"
            >
              🎯 Presentation Template
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-[var(--color-accent)] rounded-xl">
          <h4 className="font-medium text-[var(--color-text-secondary)] mb-2">💡 Writing Tips:</h4>
          <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>• Be specific about what students should deliver</li>
            <li>• Include evaluation criteria if applicable</li>
            <li>• Mention required format (PDF, Word, etc.)</li>
            <li>• Add any collaboration guidelines</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="saas-button-secondary flex-1 flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className="saas-button-primary flex-1 flex items-center justify-center space-x-2 ripple"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
