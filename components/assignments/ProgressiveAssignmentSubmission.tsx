'use client'

import { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import Alert from '../ui/alert'
import { 
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react'
import { directCloudinaryUpload } from '../../lib/directCloudinaryUpload'
import { useSubmitAssignment } from '../../hooks/useAssignments'
import { offlineSyncService } from '../../lib/offlineSyncService'
import { useErrorHandler } from '../../hooks/useErrorHandler'
import ErrorDisplay from '../ui/ErrorDisplay'

export type SubmissionStep = 'info' | 'upload' | 'success'

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
}

interface ProgressiveAssignmentSubmissionProps {
  assignment: Assignment
  studentId: string
  onBack: () => void
  onSuccess: () => void
}

export function ProgressiveAssignmentSubmission({ 
  assignment,
  studentId,
  onBack,
  onSuccess
}: ProgressiveAssignmentSubmissionProps) {
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('info')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadMessage, setUploadMessage] = useState('')
  const [marks, setMarks] = useState<number>(0)
  const { error: submissionError, handleError, clearError } = useErrorHandler()
  
  const submitAssignmentMutation = useSubmitAssignment()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validation = directCloudinaryUpload.validateFile(file)
      if (!validation.isValid) {
        setUploadMessage(validation.error || 'Invalid file selected.')
        return
      }
      setSelectedFile(file)
      setUploadMessage('')
    }
  }, [])

  const handleSubmission = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadMessage('Uploading your assignment to cloud storage...')
    clearError()

    try {
      // Step 1: Upload directly to Cloudinary
      const uploadResult = await directCloudinaryUpload.uploadFile(
        selectedFile,
        (progress) => {
          setUploadProgress(progress.percentage)
          setUploadMessage(`Uploading... ${progress.percentage}% (${directCloudinaryUpload.formatFileSize(progress.loaded)} / ${directCloudinaryUpload.formatFileSize(progress.total)})`)
        }
      )

      setUploadMessage('File uploaded successfully! Saving submission...')

      // Step 2: Submit to database (with offline queue support)
      if (!offlineSyncService.isOnline()) {
        // Queue for later if offline
        await offlineSyncService.queueAssignmentSubmission(
          assignment.id,
          studentId,
          uploadResult.secure_url,
          selectedFile.name
        )
        setUploadMessage('✓ Saved! Will sync when connection is restored.')
        setMarks(0) // Will be assigned when synced
        setTimeout(() => {
          setCurrentStep('success')
          setUploadMessage('')
        }, 2000)
      } else {
        // Submit immediately if online
        const result = await submitAssignmentMutation.mutateAsync({
          assignment_id: assignment.id,
          student_id: studentId,
          file_url: uploadResult.secure_url,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          cloudinary_public_id: uploadResult.public_id
        })

        setMarks(result.marks)
        setCurrentStep('success')
        setUploadMessage('')
      }

    } catch (error) {
      handleError(error, {
        endpoint: '/api/assignments/submit-direct',
        method: 'POST',
        userAction: 'file_upload'
      })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, studentId, assignment.id, submitAssignmentMutation, handleError, clearError])

  const renderInfoStep = () => {
    return (
      <div className="space-y-4 slide-in-left">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">{assignment.title}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Assignment Details</p>
        </div>

        <div className="bg-[var(--color-accent)] rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-[var(--color-secondary)]" />
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Due Date</p>
              <p className="font-medium text-[var(--color-primary)]">
                {new Date(assignment.due_date).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-[var(--color-secondary)]" />
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Class Year</p>
              <p className="font-medium text-[var(--color-primary)]">{assignment.class_year}</p>
            </div>
          </div>
        </div>

        {assignment.description && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Description</h4>
            <p className="text-sm text-purple-700">{assignment.description}</p>
          </div>
        )}

        <Button 
          onClick={() => setCurrentStep('upload')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
        >
          Proceed to Upload
        </Button>
      </div>
    )
  }

  const renderUploadStep = () => {
    return (
      <div className="space-y-5 slide-in-left">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentStep('info')}
            className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-primary)]">Upload File</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{assignment.title}</p>
          </div>
          <div className="w-16"></div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 mb-3 text-sm">Submission Guidelines</h4>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-sm text-blue-700">Only PDF files are accepted</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-sm text-blue-700">Maximum file size: 10MB</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-sm text-blue-700">Ensure your file is readable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all hover:shadow-md">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <label className="block text-base font-semibold text-[var(--color-primary)] mb-1">
              Choose PDF File
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">Click to browse or drag and drop</p>
          </div>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white hover:file:from-blue-700 hover:file:to-indigo-700 file:cursor-pointer file:transition-all file:shadow-sm disabled:opacity-50"
          />
          {selectedFile && (
            <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to submit
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              </div>
            </div>
          )}
        </div>

        {submissionError && (
          <ErrorDisplay
            error={submissionError}
            onRetry={() => handleSubmission()}
            onDismiss={clearError}
          />
        )}

        {uploadMessage && (
          <div className="space-y-4">
            {isUploading && uploadProgress > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-blue-900">Upload Progress</span>
                  <span className="text-lg font-bold text-blue-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-3" />
              </div>
            )}
            <Alert 
              variant={
                uploadMessage.includes('Uploading') || uploadMessage.includes('Saving') || uploadMessage.includes('Calculating') || uploadMessage.includes('Checking')
                  ? 'info' 
                  : uploadMessage.includes('successfully') || uploadMessage.includes('✓')
                    ? 'success' 
                    : uploadMessage.includes('❌') || uploadMessage.includes('Plagiarism detected')
                      ? 'error'
                      : 'info'
              } 
              message={uploadMessage}
            />
          </div>
        )}

        <Button
          onClick={handleSubmission}
          disabled={!selectedFile || isUploading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Submit Assignment</span>
            </>
          )}
        </Button>
      </div>
    )
  }

  const renderSuccessStep = () => {
    return (
      <div className="space-y-4 slide-in-left">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">🎉 Success!</h3>
          <p className="text-[var(--color-text-secondary)] mb-4">Assignment submitted successfully</p>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
            <div className="text-center">
              <p className="text-sm text-green-700 mb-2">You received</p>
              <p className="text-4xl font-bold text-green-600">{marks}/10</p>
              <p className="text-xs text-green-600 mt-1">marks</p>
            </div>
          </div>

          <div className="bg-[var(--color-accent)] rounded-lg p-4 text-left">
            <h4 className="font-semibold text-[var(--color-primary)] mb-2">Submission Details</h4>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--color-text-muted)]">
                <span className="font-medium">Assignment:</span> {assignment.title}
              </p>
              <p className="text-[var(--color-text-muted)]">
                <span className="font-medium">File:</span> {selectedFile?.name}
              </p>
              <p className="text-[var(--color-text-muted)]">
                <span className="font-medium">Submitted:</span> {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => {
            onSuccess()
            onBack()
          }}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-300"
        >
          Back to Assignments
        </Button>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'info':
        return renderInfoStep()
      case 'upload':
        return renderUploadStep()
      case 'success':
        return renderSuccessStep()
      default:
        return renderInfoStep()
    }
  }

  return (
    <div className="saas-card p-5">
      <div className="flex items-center space-x-3 mb-5">
        {currentStep !== 'success' && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--color-accent)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        )}
        <div className="flex-1">
          <h3 className="text-base font-bold text-[var(--color-primary)]">
            {currentStep === 'info' ? 'Assignment Details' : currentStep === 'upload' ? 'Upload File' : 'Submission Complete'}
          </h3>
        </div>
        {/* Step indicator dots */}
        <div className="flex space-x-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentStep === 'info' ? 'bg-blue-600 w-6' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentStep === 'upload' ? 'bg-blue-600 w-6' : currentStep === 'success' ? 'bg-blue-400' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${currentStep === 'success' ? 'bg-green-600 w-6' : 'bg-gray-300'}`} />
        </div>
      </div>

      {renderCurrentStep()}
    </div>
  )
}
