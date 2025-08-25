'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
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
  Lock,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Alert from '@/components/ui/alert'

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
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-black">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Header with Back Button */}
      <div className="backdrop-blur-md border-b bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button variant="ghost" asChild className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 hover:shadow-xl rounded-xl px-6 py-3   hover:border-blue-300">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 mr-2" />
           
              </Link>
            </Button>
            <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3 ">
              <p className="text-xl font-bold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 font-medium">{user.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl p-2 mx-auto max-w-2xl">
            <h1 className="text-xl font-bold text-gray-800 mb-3">Assignments</h1>
            <p className="text-gray-600 text-sm">View and submit your NPTEL course assignments</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-200">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-700 font-medium">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card className="bg-white shadow-2xl border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments available</h3>
              <p className="text-gray-500">There are currently no assignments for your class.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-gray-800 text-xl font-bold">{assignment.title}</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        {assignment.description}
                      </CardDescription>
                    </div>
                    <Badge variant={assignment.submission ? "default" : "secondary"}>
                      {assignment.submission ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {formatDate(assignment.due_date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {assignment.class_year}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between">
                      {assignment.submission ? (
                        <div className="text-right">
                          <div className="flex items-center justify-end text-green-600 font-medium mb-1">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Submitted
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(assignment.submission.submitted_at)}
                          </div>
                          {assignment.submission.marks !== null && (
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Marks: {assignment.submission.marks}
                            </div>
                          )}
                        </div>
                      ) : isOverdue(assignment.due_date) ? (
                        <div className="text-red-600 flex items-center">
                          <Lock className="h-4 w-4 mr-1" />
                          Overdue
                        </div>
                      ) : (
                        <div className="space-y-3 w-full">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileSelect(e, assignment.id)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer file:shadow-lg file:hover:shadow-xl file:transition-all file:duration-300"
                          />
                          <Button
                            onClick={() => handleSubmission(assignment.id)}
                            disabled={!selectedFile || currentAssignmentId !== assignment.id || isUploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
                          >
                            {isUploading && currentAssignmentId === assignment.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Assignment
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {uploadMessage && currentAssignmentId === assignment.id && (
                    <Alert 
                      variant={
                        uploadMessage === 'Uploading your assignment...' 
                          ? 'warning' 
                          : uploadMessage.includes('successfully') 
                            ? 'success' 
                            : 'error'
                      } 
                      message={uploadMessage} 
                      className="mt-4"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
