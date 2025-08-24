'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Trophy,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  marks: number | null
  submitted_at: string
  status: 'submitted' | 'graded'
}

interface AssignmentWithSubmission extends Assignment {
  submission?: AssignmentSubmission
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    loadAssignments()
  }, [user, router])

  const loadAssignments = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log('User data:', user)
      console.log('User class_year:', user.class_year)
      
      // Load assignments filtered by student's class year
      const response = await fetch('/api/assignments/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id,
          class_year: user.class_year
        })
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Failed to load assignments')
      }

      const { data } = await response.json()
      console.log('Assignments data received:', data)
      setAssignments(data || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      // Debug: Log file information
      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setUploadMessage('Please select a PDF file only.')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadMessage('File size must be less than 10MB.')
        return
      }

      setSelectedFile(file)
      setCurrentAssignmentId(assignmentId)
      setUploadMessage('')
    }
  }

  const handleSubmission = async (assignmentId: string) => {
    if (!selectedFile || !user) return

    setIsUploading(true)
    setUploadMessage('Uploading your assignment...')

    try {
      // Debug: Log submission information
      console.log('Starting file submission:', {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        assignmentId,
        studentId: user.id,
        registerNumber: user.register_number,
        studentName: user.name
      })
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('assignment_id', assignmentId)
      formData.append('student_id', user.id)
      formData.append('register_number', user.register_number || '')
      formData.append('student_name', user.name || '')

      // Submit via API route (handles both upload and database insertion)
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        body: formData // Don't set Content-Type header for FormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit assignment')
      }

      const { data, marks } = await response.json()

      setUploadMessage(`Assignment submitted successfully! You got ${marks} marks.`)
      setSelectedFile(null)
      setCurrentAssignmentId(null)
      
      // Reload assignments to show updated status
      setTimeout(() => {
        loadAssignments()
        setUploadMessage('')
      }, 2000)

    } catch (error) {
      console.error('Error submitting assignment:', error)
      setUploadMessage('Failed to submit assignment. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate)
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="text-gray-600">Loading assignments...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] ">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-black mb-4">
          Assignment Submission Portal
        </h2>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Button variant="outline" asChild className="bg-transparent hover:bg-gray-50 border border-gray-300">
          <Link href="/" className="text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* User Info */}
      <div className="backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            {user?.name ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-black">
                  Welcome, {user.name}
                </h2>
                <p className="text-sm text-black">
                  {user.register_number || ''} {user.register_number && user.class_year ? '•' : ''} {user.class_year || ''}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-500 text-sm">Please update your profile</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Message */}
        {uploadMessage && (
          <Card className="mb-6 bg-transparent">
            <CardContent className="pt-6">
              <div className={`flex items-center space-x-2 ${
                uploadMessage.includes('successfully') || uploadMessage.includes('marks') 
                  ? 'text-green-600' 
                  : uploadMessage.includes('Failed') 
                  ? 'text-red-600' 
                  : 'text-blue-600'
              }`}>
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : uploadMessage.includes('successfully') ? (
                  <CheckCircle className="h-5 w-5" />
                ) : uploadMessage.includes('Failed') ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{uploadMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card className="hover:shadow-lg transition-shadow bg-transparent">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No Assignments Available</h3>
                <p className="text-sm text-gray-600">Check back later for new assignments.</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className={`transition-shadow bg-transparent ${
                isOverdue(assignment.due_date) && !assignment.submission 
                  ? 'opacity-75 border-red-200 hover:shadow-md' 
                  : 'hover:shadow-lg'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center relative ${
                        isOverdue(assignment.due_date) ? 'bg-red-100' : 'bg-purple-100'
                      }`}>
                        <FileText className={`h-6 w-6 ${
                          isOverdue(assignment.due_date) ? 'text-red-600' : 'text-purple-600'
                        }`} />
                        {isOverdue(assignment.due_date) && !assignment.submission && (
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                            <Lock className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${
                          isOverdue(assignment.due_date) && !assignment.submission ? 'text-gray-500' : 'text-black'
                        }`}>{assignment.title}</h3>
                        <p className={`text-sm ${
                          isOverdue(assignment.due_date) && !assignment.submission ? 'text-gray-400' : 'text-gray-600'
                        }`}>{assignment.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignment.submission ? (
                        assignment.submission.status === 'graded' ? (
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm font-medium text-green-600">
                              {assignment.submission.marks}/10 marks
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600">Submitted</span>
                          </div>
                        )
                      ) : isOverdue(assignment.due_date) ? (
                        <div className="flex items-center space-x-1 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                          <Lock className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Locked</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Open</span>
                        </div>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <span className="flex items-center mt-2 justify-between text-red-500 text-sm">
                      <span >Due: {formatDate(assignment.due_date)}</span>
                   
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {assignment.submission ? (
                      // Already submitted
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-black">
                          Submitted: {assignment.submission.file_name.substring(0, 13)}... at {formatDate(assignment.submission.submitted_at)}
                        </span>
                      </div>
                    ) : !isOverdue(assignment.due_date) ? (
                      // Can submit
                      <div className="space-y-3">
                        <div>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileSelect(e, assignment.id)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Only PDF files up to 10MB are allowed</p>
                        </div>
                        {selectedFile && currentAssignmentId === assignment.id && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-black">Ready to submit</span>
                            <Button
                              onClick={() => handleSubmission(assignment.id)}
                              disabled={isUploading}
                              className="bg-purple-600 text-white border border-purple-600 hover:bg-purple-700"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Submit
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Locked/Overdue
                      <div className="text-center py-6 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <Lock className="h-8 w-8 text-red-500" />
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-red-700 mb-2">Assignment Locked</h4>
                        <p className="text-sm text-red-600 mb-1">This assignment is past its due date and cannot be submitted.</p>
                        <p className="text-xs text-red-500">Due date was: {formatDate(assignment.due_date)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadAssignments}
            disabled={isLoading}
            className="bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Assignments
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}