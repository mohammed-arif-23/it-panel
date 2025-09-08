'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet,
  Users,
  Clock
} from 'lucide-react'

interface Student {
  id: string
  register_number: string
  name: string
  email: string
  class_year: string
}

interface Booking {
  id: string
  student_id: string
  seminar_date: string
  booking_status: string
  created_at: string
  unified_students?: Student
}

interface BookingAnalytics {
  totalStudents: number
  totalBooked: number
  totalNotBooked: number
  bookedStudents: any[]
  notBookedStudents: Student[]
  bookingsByClass: {
    'II-IT': { total: number; booked: number; notBooked: number }
    'III-IT': { total: number; booked: number; notBooked: number }
  }
}

interface ModernBookingAnalyticsProps {
  isLoading: boolean
  onRefresh: () => void
  onExport: (data: any[], filename: string) => void
  formatDateTime: (date: string) => string
}

export default function ModernBookingAnalytics({
  isLoading,
  onRefresh,
  onExport,
  formatDateTime
}: ModernBookingAnalyticsProps) {
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'overview' | 'booked' | 'not_booked'>('overview')
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  const fetchBookingAnalytics = async () => {
    setIsLoadingAnalytics(true)
    try {
      const params = new URLSearchParams({ 
        class: selectedClass,
        date: selectedDate 
      })
      const response = await fetch(`/api/admin/booking-analytics?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setBookingAnalytics(data.data)
      } else {
        console.error('Booking analytics API error:', data.error)
        setBookingAnalytics(null)
      }
    } catch (error) {
      console.error('Failed to fetch booking analytics:', error)
      setBookingAnalytics(null)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    fetchBookingAnalytics()
  }, [selectedClass, selectedDate])

  const handleRefresh = () => {
    fetchBookingAnalytics()
    onRefresh()
  }

  const handleExport = () => {
    if (!bookingAnalytics) {
      onExport([], `bookings_${selectedClass}_${selectedDate}`)
      return
    }

    let exportData: any[] = []
    let filename = `booking_status_${selectedClass}_${selectedDate}`

    if (viewMode === 'booked') {
      exportData = bookingAnalytics.bookedStudents.map((student: any) => ({
        'Register Number': student.register_number,
        Name: student.name,
        Email: student.email,
        Class: student.class_year,
        Status: 'Booked',
        'Seminar Topic': student.seminar_topic || '-',
        'Booking Date': student.booking_date || selectedDate,
        'Booked At': student.booking_time ? formatDateTime(student.booking_time) : '-'
      }))
    } else if (viewMode === 'not_booked') {
      exportData = bookingAnalytics.notBookedStudents.map((student: any) => ({
        'Register Number': student.register_number,
        Name: student.name,
        Email: student.email,
        Class: student.class_year,
        Status: 'Not Booked',
        'Seminar Topic': '-',
        'Booking Date': selectedDate,
        'Booked At': '-'
      }))
    } else {
      // overview: consolidated per-student list (Booked + Not Booked)
      exportData = [
        ...bookingAnalytics.bookedStudents.map((student: any) => ({
          'Register Number': student.register_number,
          Name: student.name,
          Email: student.email,
          Class: student.class_year,
          Status: 'Booked',
          'Seminar Topic': student.seminar_topic || '-',
          'Booking Date': student.booking_date || selectedDate,
          'Booked At': student.booking_time ? formatDateTime(student.booking_time) : '-'
        })),
        ...bookingAnalytics.notBookedStudents.map((student: any) => ({
          'Register Number': student.register_number,
          Name: student.name,
          Email: student.email,
          Class: student.class_year,
          Status: 'Not Booked',
          'Seminar Topic': '-',
          'Booking Date': selectedDate,
          'Booked At': '-'
        }))
      ]
    }

    // If chosen view produced no rows, fall back to consolidated list
    if (exportData.length === 0) {
      exportData = [
        ...bookingAnalytics.bookedStudents.map((student: any) => ({
          'Register Number': student.register_number,
          Name: student.name,
          Email: student.email,
          Class: student.class_year,
          Status: 'Booked',
          'Seminar Topic': student.seminar_topic || '-',
          'Booking Date': student.booking_date || selectedDate,
          'Booked At': student.booking_time ? formatDateTime(student.booking_time) : '-'
        })),
        ...bookingAnalytics.notBookedStudents.map((student: any) => ({
          'Register Number': student.register_number,
          Name: student.name,
          Email: student.email,
          Class: student.class_year,
          Status: 'Not Booked',
          'Seminar Topic': '-',
          'Booking Date': selectedDate,
          'Booked At': '-'
        }))
      ]
    }

    onExport(exportData, filename)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Analytics</h2>
          <p className="text-gray-600">View seminar booking statistics and manage student bookings</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="text-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Class Filter */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Calendar className="h-5 w-5 mr-2" />
            Booking Overview
          </CardTitle>
          <CardDescription className="text-gray-600">
            View student booking statistics for upcoming seminars
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Class
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="II-IT">II-IT</SelectItem>
                  <SelectItem value="III-IT">III-IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {bookingAnalytics && (
        <>
          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {bookingAnalytics.totalStudents}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Booked</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bookingAnalytics.totalBooked}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Not Booked</p>
                    <p className="text-2xl font-bold text-red-600">
                      {bookingAnalytics.totalNotBooked}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Booking Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {bookingAnalytics.totalStudents > 0 
                        ? Math.round((bookingAnalytics.totalBooked / bookingAnalytics.totalStudents) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Mode Selection and Export */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'overview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('overview')}
                    className={viewMode === 'overview' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Overview
                  </Button>
                  <Button
                    variant={viewMode === 'booked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('booked')}
                    className={viewMode === 'booked' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Booked ({bookingAnalytics.totalBooked})
                  </Button>
                  <Button
                    variant={viewMode === 'not_booked' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('not_booked')}
                    className={viewMode === 'not_booked' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Not Booked ({bookingAnalytics.totalNotBooked})
                  </Button>
                </div>
                
                <Button onClick={handleExport} disabled={isLoadingAnalytics || !bookingAnalytics} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
                  <Download className="h-4 w-4 mr-2" />
                  Export Status to Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">
                {viewMode === 'overview' ? 'Class Summary' :
                 viewMode === 'booked' ? 'Students with Bookings' : 'Students without Bookings'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Selected Date: {selectedDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : viewMode === 'overview' ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">II-IT Class</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Total: {bookingAnalytics.bookingsByClass['II-IT']?.total || 0}</p>
                      <p>Booked: {bookingAnalytics.bookingsByClass['II-IT']?.booked || 0}</p>
                      <p>Not Booked: {bookingAnalytics.bookingsByClass['II-IT']?.notBooked || 0}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">III-IT Class</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Total: {bookingAnalytics.bookingsByClass['III-IT']?.total || 0}</p>
                      <p>Booked: {bookingAnalytics.bookingsByClass['III-IT']?.booked || 0}</p>
                      <p>Not Booked: {bookingAnalytics.bookingsByClass['III-IT']?.notBooked || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-700">Register Number</TableHead>
                      <TableHead className="text-gray-700">Name</TableHead>
                      <TableHead className="text-gray-700">Email</TableHead>
                      <TableHead className="text-gray-700">Class</TableHead>
                      {viewMode === 'booked' && (
                        <>
                          <TableHead className="text-gray-700">Status</TableHead>
                          <TableHead className="text-gray-700">Seminar Topic</TableHead>
                          <TableHead className="text-gray-700">Booked At</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewMode === 'booked' 
                      ? bookingAnalytics.bookedStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="text-gray-900">{student.register_number}</TableCell>
                            <TableCell className="text-gray-900">{student.name}</TableCell>
                            <TableCell className="text-gray-600">{student.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                {student.class_year}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">
                                Booked
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {student.seminar_topic || '-'}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {student.booking_time ? formatDateTime(student.booking_time) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      : bookingAnalytics.notBookedStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="text-gray-900">{student.register_number}</TableCell>
                            <TableCell className="text-gray-900">{student.name}</TableCell>
                            <TableCell className="text-gray-600">{student.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                {student.class_year}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                    }
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* No Data State */}
      {!bookingAnalytics && !isLoadingAnalytics && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No booking data available</p>
              <p className="text-sm text-gray-400">
                Check your database connection or create bookings to see analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}