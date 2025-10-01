'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Upload, File, X } from 'lucide-react'

interface AssignmentUploadStepProps {
  data: any
  onNext: (data: any) => void
  onBack: () => void
}

export function AssignmentUploadStep({ data, onNext, onBack }: AssignmentUploadStepProps) {
  const [files, setFiles] = useState<File[]>(data?.files || [])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles([...files, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    onNext({ files })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles([...files, ...newFiles])
    }
  }

  return (
    <div className="saas-card p-6">
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Upload Files</h2>

      <div className="space-y-6">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-[var(--color-secondary)] bg-[var(--color-accent)]'
              : 'border-[var(--color-border-light)] hover:border-[var(--color-secondary)]'
          }`}
        >
          <Upload className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-primary)] font-medium mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Supports PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-upload" className="saas-button-secondary inline-block cursor-pointer ripple">
            Browse Files
          </label>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--color-primary)] mb-3">
              Uploaded Files ({files.length})
            </h3>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[var(--color-accent)] rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-[var(--color-secondary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-primary)]">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-[var(--color-error)] hover:bg-[var(--color-error)] hover:bg-opacity-10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            className="saas-button-secondary flex-1 ripple"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="saas-button-primary flex-1 ripple"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
