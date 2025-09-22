'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Plus, 
  Save, 
  X, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  FileSpreadsheet,
  Users,
  Clock,
  Download,
  Eye,
  ArrowLeft,
  FileText
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
  submission_count?: number
  graded_count?: number
  average_marks?: number
}

interface Student {
  id: string
  register_number: string
  name: string
  email: string
  class_year: string
  submissionDetails?: {
    id?: string
    submitted_at?: string
    marks?: number
    graded_at?: string
    file_url?: string
    status: 'submitted' | 'graded' | 'not_submitted'
  }
}

interface SubmissionData {
  assignment: Assignment
  submittedStudents: Student[]
  notSubmittedStudents: Student[]
  summary: {
    total: number
    submitted: number
    notSubmitted: number
    graded: number
    averageMarks: number
  }
}

interface ModernAssignmentManagementProps {
  assignments: Assignment[]
  isLoading: boolean
  onRefresh: () => void
  onAddAssignment: (assignment: any) => Promise<void>
  onDeleteAssignment: (id: string, title: string) => Promise<void>
  formatDateTime: (date: string) => string
  exportToExcel?: (data: any[], filename: string) => void
}

export default function ModernAssignmentManagement({
  assignments,
  isLoading,
  onRefresh,
  onAddAssignment,
  onDeleteAssignment,
  formatDateTime,
  exportToExcel
}: ModernAssignmentManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    class_year: '',
    due_date: ''
  })
  
  // Submission view states
  const [viewMode, setViewMode] = useState<'list' | 'submissions'>('list')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [submissionFilters, setSubmissionFilters] = useState({
    class: 'all',
    status: 'all' // all, submitted, not_submitted
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onAddAssignment(newAssignment)
      setNewAssignment({ title: '', description: '', class_year: '', due_date: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding assignment:', error)
    }
  }

  // Fetch submission details for an assignment
  const fetchSubmissionDetails = async (assignment: Assignment) => {
    setIsLoadingSubmissions(true)
    setSelectedAssignment(assignment)
    setViewMode('submissions')
    
    try {
      const params = new URLSearchParams({
        assignment_id: assignment.id,
        class: submissionFilters.class,
        status: submissionFilters.status
      })
      
      const response = await fetch(`/api/admin/assignment-submissions?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSubmissionData(data.data)
      } else {
        console.error('Submission data error:', data.error)
        setSubmissionData(null)
      }
    } catch (error) {
      console.error('Failed to fetch submission details:', error)
      setSubmissionData(null)
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  // Handle filter changes
  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissionDetails(selectedAssignment)
    }
  }, [submissionFilters])

  // Go back to assignments list
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedAssignment(null)
    setSubmissionData(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            {viewMode === 'submissions' && (
              <Button
                onClick={handleBackToList}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {viewMode === 'list' ? 'Assignment Management' : `Submissions: ${selectedAssignment?.title}`}
              </h2>
              <p className="text-gray-600">
                {viewMode === 'list' 
                  ? 'Create, manage, and track student assignments'
                  : `View submission details for ${selectedAssignment?.class_year} students`
                }
              </p>
            </div>
          </div>
        </div>
        {viewMode === 'list' && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        )}
      </div>

      {/* Add Assignment Form */}
      {viewMode === 'list' && showAddForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Create New Assignment</CardTitle>
            <CardDescription>Add a new assignment for students to submit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                    placeholder="Enter assignment title"
                    className="bg-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="class_year">Class Year *</Label>
                  <Select
                    value={newAssignment.class_year}
                    onValueChange={(value) => setNewAssignment({...newAssignment, class_year: value})}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select class year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="II-IT">II-IT (2nd Year)</SelectItem>
                      <SelectItem value="III-IT">III-IT (3rd Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  placeholder="Enter assignment description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date & Time *</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                  className="bg-white"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewAssignment({ title: '', description: '', class_year: '', due_date: '' })
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assignment Statistics */}
      {viewMode === 'list' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-3xl font-bold text-green-600">
                  {assignments.filter(a => new Date(a.due_date) > new Date()).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Button
                onClick={onRefresh}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}      

      {/* Assignments Table */}
      {viewMode === 'list' && (
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>Manage and view assignment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading assignments...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No assignments found</p>
              <p className="text-sm text-gray-400">Create your first assignment to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class Year</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={assignment.class_year === 'II-IT' ? 'border-blue-200 text-blue-800' : 'border-green-200 text-green-800'}
                        >
                          {assignment.class_year}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(assignment.due_date)}</TableCell>
                      <TableCell>
                        {new Date(assignment.due_date) > new Date() ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Closed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{assignment.submission_count || 0}</span>
                      </TableCell>
                      <TableCell>{formatDateTime(assignment.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => fetchSubmissionDetails(assignment)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => onDeleteAssignment(assignment.id, assignment.title)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Submissions View */}
      {viewMode === 'submissions' && (
        <>
          {/* Submission Statistics */}
          {submissionData && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-3xl font-bold text-gray-900">{submissionData.summary.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Submitted</p>
                      <p className="text-3xl font-bold text-green-600">{submissionData.summary.submitted}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Not Submitted</p>
                      <p className="text-3xl font-bold text-red-600">{submissionData.summary.notSubmitted}</p>
                    </div>
                    <Clock className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Graded</p>
                      <p className="text-3xl font-bold text-blue-600">{submissionData.summary.graded}</p>
                    </div>
                    <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Marks</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {submissionData.summary.averageMarks > 0 ? Math.round(submissionData.summary.averageMarks * 100) / 100 : '-'}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Class Filter</Label>
                  <Select
                    value={submissionFilters.class}
                    onValueChange={(value) => setSubmissionFilters({...submissionFilters, class: value})}
                  >
                    <SelectTrigger className="mt-2 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="II-IT">II-IT</SelectItem>
                      <SelectItem value="III-IT">III-IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status Filter</Label>
                  <Select
                    value={submissionFilters.status}
                    onValueChange={(value) => setSubmissionFilters({...submissionFilters, status: value})}
                  >
                    <SelectTrigger className="mt-2 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted Only</SelectItem>
                      <SelectItem value="not_submitted">Not Submitted Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button
                    onClick={() => {
                      if (exportToExcel && submissionData) {
                        exportToExcel([
                          ...submissionData.submittedStudents.map(s => ({
                            Register_Number: s.register_number,
                            Name: s.name,
                            Email: s.email,
                            Class: s.class_year,
                            Status: s.submissionDetails?.status || 'unknown',
                            Submitted_At: s.submissionDetails?.submitted_at || '-',
                            Marks: s.submissionDetails?.marks || '-'
                          })),
                          ...submissionData.notSubmittedStudents.map(s => ({
                            Register_Number: s.register_number,
                            Name: s.name,
                            Email: s.email,
                            Class: s.class_year,
                            Status: 'not_submitted',
                            Submitted_At: '-',
                            Marks: '-'
                          }))
                        ], `${selectedAssignment?.title}_submissions`)
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!submissionData || !exportToExcel}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingSubmissions ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading submission details...</span>
                </div>
              </CardContent>
            </Card>
          ) : submissionData ? (
            <>
              {/* Submitted Students */}
              {(submissionFilters.status === 'all' || submissionFilters.status === 'submitted') && submissionData.submittedStudents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-800">Submitted Students ({submissionData.submittedStudents.length})</CardTitle>
                    <CardDescription>Students who have submitted this assignment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Register Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>View</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissionData.submittedStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.register_number}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={student.class_year === 'II-IT' ? 'border-blue-200 text-blue-800' : 'border-green-200 text-green-800'}
                                >
                                  {student.class_year}
                                </Badge>
                              </TableCell>
                              <TableCell>{student.submissionDetails?.submitted_at ? formatDateTime(student.submissionDetails.submitted_at) : '-'}</TableCell>
                              <TableCell>
                                {student.submissionDetails?.marks !== null && student.submissionDetails?.marks !== undefined
                                  ? student.submissionDetails.marks
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Badge className={student.submissionDetails?.status === 'graded' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                  {student.submissionDetails?.status || 'submitted'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => window.open(student.submissionDetails?.file_url || '', '_blank')}
                                  variant="outline"
                                  size="sm"
                                  disabled={!student.submissionDetails?.file_url}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Not Submitted Students */}
              {(submissionFilters.status === 'all' || submissionFilters.status === 'not_submitted') && submissionData.notSubmittedStudents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-800">Not Submitted Students ({submissionData.notSubmittedStudents.length})</CardTitle>
                    <CardDescription>Students who haven't submitted this assignment yet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Register Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {submissionData.notSubmittedStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.register_number}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={student.class_year === 'II-IT' ? 'border-blue-200 text-blue-800' : 'border-green-200 text-green-800'}
                                >
                                  {student.class_year}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-red-100 text-red-800">Not Submitted</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No submission data available</p>
                  <p className="text-sm text-gray-400">Unable to load submission details for this assignment.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}