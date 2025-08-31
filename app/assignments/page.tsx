'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
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
  Users,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { formatFileSize, validateFileSize, validateFileType } from '../../lib/utils'
import { directCloudinaryUpload, CloudinaryUploadProgress } from '../../lib/directCloudinaryUpload'
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
  const [uploadProgress, setUploadProgress] = useState<number>(0)

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
      // User data loaded successfully
      // User class year identified
      
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

      // API Response received successfully
      
      if (!response.ok) {
        throw new Error('Failed to load assignments')
      }

      const { data } = await response.json()
      // Assignments data received successfully
      setAssignments(data || [])
    } catch (error) {
      // Error loading assignments - handling silently
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      // File selected for upload
      
      // Use Cloudinary's validation
      const validation = directCloudinaryUpload.validateFile(file)
      if (!validation.isValid) {
        setUploadMessage(validation.error || 'Invalid file selected.')
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
    setUploadProgress(0)
    setUploadMessage('Uploading your assignment to cloud storage...')

    try {
      // Starting direct upload process
      
      // Step 1: Upload directly to Cloudinary
      const uploadResult = await directCloudinaryUpload.uploadFile(
        selectedFile,
        (progress) => {
          setUploadProgress(progress.percentage)
          setUploadMessage(`Uploading... ${progress.percentage}% (${formatFileSize(progress.loaded)} / ${formatFileSize(progress.total)})`)
        }
      )

      // Cloudinary upload successful
      setUploadMessage('File uploaded successfully! Saving submission...')

      // Step 2: Submit to database with Cloudinary URL
      const response = await fetch('/api/assignments/submit-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: uploadResult.secure_url,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          cloudinary_public_id: uploadResult.public_id
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save assignment submission'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = `Server error (${response.status}). Please try again.`
        }
        
        throw new Error(errorMessage)
      }

      const { data, marks } = await response.json()

      setUploadMessage(`🎉 Assignment submitted successfully! You got ${marks} marks.`)
      setSelectedFile(null)
      setCurrentAssignmentId(null)
      setUploadProgress(0)
      
      // Reload assignments to show updated status
      setTimeout(() => {
        loadAssignments()
        setUploadMessage('')
      }, 3000)

    } catch (error) {
      // Error in assignment submission - handling silently
      setUploadMessage(`❌ ${error instanceof Error ? error.message : 'Failed to submit assignment. Please try again.'}`)
      setUploadProgress(0)
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
              <Card key={assignment.id} className="group relative overflow-hidden bg-white shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <div className="relative bg-white m-1 rounded-lg">
                  <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-lg border-b border-purple-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-gray-800 text-xl font-bold">{assignment.title}</CardTitle>
                          <CardDescription className="text-gray-600 mt-1">
                            {assignment.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={assignment.submission ? "default" : "secondary"}>
                          {assignment.submission ? 'Submitted' : 'Pending'}
                        </Badge>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Assignment Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-3 bg-purple-50 rounded-xl">
                            <div className="flex items-center text-sm text-purple-600 font-semibold mb-1">
                              <Calendar className="h-4 w-4 mr-2" />
                              Due Date
                            </div>
                            <p className="text-gray-800 font-medium">{formatDate(assignment.due_date)}</p>
                          </div>
                          <div className="p-3 bg-pink-50 rounded-xl">
                            <div className="flex items-center text-sm text-pink-600 font-semibold mb-1">
                              <Users className="h-4 w-4 mr-2" />
                              Class Year
                            </div>
                            <p className="text-gray-800 font-medium">{assignment.class_year}</p>
                          </div>
                        </div>
                    
                        <div className="flex flex-col justify-between">
                          {assignment.submission ? (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                              <div className="flex items-center justify-center text-green-600 font-semibold mb-2">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Successfully Submitted
                              </div>
                              <div className="text-center space-y-2">
                                <div className="text-sm text-gray-600">
                                  Submitted: {formatDate(assignment.submission.submitted_at)}
                                </div>
                                {assignment.submission.marks !== null && (
                                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                    <Award className="h-4 w-4 mr-1" />
                                    Marks: {assignment.submission.marks}/10
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : isOverdue(assignment.due_date) ? (
                            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 text-center">
                              <div className="text-red-600 flex items-center justify-center font-semibold">
                                <Lock className="h-5 w-5 mr-2" />
                                Submission Overdue
                              </div>
                              <p className="text-sm text-red-500 mt-1">Assignment deadline has passed</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                <label className="block text-sm font-bold text-blue-600 mb-3 uppercase tracking-wider">
                                  Upload Assignment (PDF only, up to 10MB)
                                </label>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => handleFileSelect(e, assignment.id)}
                                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-500 file:to-cyan-500 file:text-white hover:file:from-blue-600 hover:file:to-cyan-600 file:cursor-pointer file:shadow-lg file:hover:shadow-xl file:transition-all file:duration-300"
                                />
                              </div>
                              <Button
                                onClick={() => handleSubmission(assignment.id)}
                                disabled={!selectedFile || currentAssignmentId !== assignment.id || isUploading}
                                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                {isUploading && currentAssignmentId === assignment.id ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Uploading Assignment...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-5 w-5 mr-2" />
                                    Submit Assignment
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                  
                      {uploadMessage && currentAssignmentId === assignment.id && (
                        <div className="mt-6 space-y-3">
                          {isUploading && uploadProgress > 0 && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-700">Upload Progress</span>
                                <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="h-3" />
                            </div>
                          )}
                          <Alert 
                            variant={
                              uploadMessage.includes('Uploading') || uploadMessage.includes('Saving') 
                                ? 'warning' 
                                : uploadMessage.includes('successfully') || uploadMessage.includes('🎉')
                                  ? 'success' 
                                  : uploadMessage.includes('❌')
                                    ? 'error'
                                    : 'info'
                            } 
                            message={uploadMessage} 
                            className="border-2"
                            onClose={() => setUploadMessage('')}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
