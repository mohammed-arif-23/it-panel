'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import Alert from '../../components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Database, 
  Download, 
  LogOut, 
  RefreshCw, 
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  Users,
  Calendar,
  CalendarDays
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import * as XLSX from 'xlsx';
import HolidayManagement from '../../components/HolidayManagement';

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
  type: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  displayName: string;
  table: string;
  fullName: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Panel state
  const [activeTab, setActiveTab] = useState<'database' | 'assignments' | 'bookings' | 'students' | 'attendance' | 'fines' | 'holidays'>('database');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Assignment management state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    class_year: '',
    due_date: ''
  });

  // Booking Analytics state
  const [bookingAnalytics, setBookingAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'not-booked' | 'booked'>('overview');

  // Student Search state
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    classYear: 'all',
    emailVerified: undefined,
    registrationStatus: 'all',
    fineStatus: 'all',
    lastLoginDays: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    pageSize: 25
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Attendance Tracking state
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceFilters, setAttendanceFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    classYear: 'all',
    status: 'all'
  });
  const [selectedAttendanceStudents, setSelectedAttendanceStudents] = useState<string[]>([]);
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState('present');
  const [seminarTopic, setSeminarTopic] = useState('');
  const [attendanceNotes, setAttendanceNotes] = useState('');

  // Fine Management state
  const [fineData, setFineData] = useState<any>(null);
  const [isLoadingFines, setIsLoadingFines] = useState(false);
  const [fineError, setFineError] = useState('');
  const [fineFilters, setFineFilters] = useState({
    classYear: 'all',
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('mark_paid');
  const [showCreateFine, setShowCreateFine] = useState(false);
  const [newFine, setNewFine] = useState({
    studentId: '',
    fineType: 'seminar_no_booking',
    referenceDate: new Date().toISOString().split('T')[0],
    baseAmount: 10, // Fixed ₹10 per day
    dailyIncrement: 0, // No increments in new system
    reason: ''
  });

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      
      if (data.authenticated) {
        fetchTables();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        fetchTables();
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setTables([]);
      setSelectedTables([]);
      setAvailableColumns([]);
      setSelectedColumns([]);
      setTableData([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/admin/tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const handleTableSelection = async (tableName: string, checked: boolean) => {
    let newSelectedTables;
    
    if (checked) {
      newSelectedTables = [...selectedTables, tableName];
    } else {
      newSelectedTables = selectedTables.filter(t => t !== tableName);
    }
    
    setSelectedTables(newSelectedTables);
    
    if (newSelectedTables.length > 0) {
      await fetchColumns(newSelectedTables);
    } else {
      setAvailableColumns([]);
      setSelectedColumns([]);
      setTableData([]);
    }
  };

  const fetchColumns = async (tableNames: string[]) => {
    try {
      const response = await fetch('/api/admin/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables: tableNames }),
      });

      const data = await response.json();
      setAvailableColumns(data.columns || []);
      setSelectedColumns([]);
      setTableData([]);
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    }
  };

  const handleColumnSelection = (columnName: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnName]);
    } else {
      setSelectedColumns(selectedColumns.filter(c => c !== columnName));
    }
  };

  const fetchData = async () => {
    if (selectedTables.length === 0) {
      setDataError('Please select at least one table');
      return;
    }

    setIsLoadingData(true);
    setDataError('');

    try {
      const columnsToFetch = selectedColumns.length > 0 ? selectedColumns.join(',') : '*';
      
      const response = await fetch('/api/admin/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tables: selectedTables,
          columns: columnsToFetch 
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setDataError(data.error);
        setTableData([]);
      } else {
        setTableData(data.data || []);
        setDataError('');
      }
    } catch (error) {
      setDataError('Failed to fetch data');
      setTableData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportToExcel = () => {
    if (tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    
    const fileName = `admin_export_${selectedTables.join('_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, fileName);
  };

  const getColumnHeaders = () => {
    if (tableData.length === 0) return [];
    
    const firstRow = tableData[0];
    return Object.keys(firstRow);
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Assignment management functions
  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await fetch('/api/admin/assignments');
      const data = await response.json();
      setAssignments(data.data || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssignment.title || !newAssignment.class_year || !newAssignment.due_date) {
      alert('Title, class year, and due date are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        setNewAssignment({ title: '', description: '', class_year: '', due_date: '' });
        setShowAddAssignment(false);
        fetchAssignments();
        alert('Assignment added successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to add assignment: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert('Failed to add assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${assignmentTitle}"? This will also delete all submissions for this assignment.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assignments?id=${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAssignments();
        alert('Assignment deleted successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to delete assignment: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load assignments when tab changes
  useEffect(() => {
    if (activeTab === 'assignments' && isAuthenticated) {
      fetchAssignments();
    } else if (activeTab === 'bookings' && isAuthenticated) {
      fetchBookingAnalytics();
    } else if (activeTab === 'students' && isAuthenticated) {
      performStudentSearch();
    } else if (activeTab === 'attendance' && isAuthenticated) {
      fetchAttendanceData();
    } else if (activeTab === 'fines' && isAuthenticated) {
      fetchFineData();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch booking analytics when filters change
  useEffect(() => {
    if (activeTab === 'bookings' && isAuthenticated) {
      fetchBookingAnalytics();
    }
  }, [selectedDate, selectedClass]);

  // Student Search functions
  const performStudentSearch = async () => {
    setIsLoadingSearch(true);
    setSearchError('');

    try {
      const response = await fetch('/api/admin/student-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchFilters),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        setSearchError(data.error || 'Failed to search students');
      }
    } catch (error) {
      console.error('Failed to search students:', error);
      setSearchError('Failed to search students');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSearchFilterChange = (key: string, value: any) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when filters change
    }));
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const exportStudentsToExcel = () => {
    if (!searchResults?.students?.length) {
      alert('No students to export');
      return;
    }

    const exportData = searchResults.students.map((student: any) => ({
      'Register Number': student.register_number,
      'Name': student.name || '',
      'Email': student.email || '',
      'Mobile': student.mobile || '',
      'Class Year': student.class_year,
      'Email Verified': student.email_verified ? 'Yes' : 'No',
      'Total Fines': `₹${student.computed_total_fines}`,
      'Days Since Login': student.computed_days_since_login || 'Never',
      'Registration Types': student.computed_registration_types?.join(', ') || '',
      'Created At': new Date(student.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, fileName);
  };

  // Attendance Tracking functions
  const fetchAttendanceData = async () => {
    setIsLoadingAttendance(true);
    setAttendanceError('');

    try {
      const params = new URLSearchParams({
        date: attendanceFilters.date,
        class: attendanceFilters.classYear,
        status: attendanceFilters.status
      });

      const response = await fetch(`/api/admin/attendance?${params}`);
      const data = await response.json();

      if (data.success) {
        setAttendanceData(data.data);
      } else {
        setAttendanceError(data.error || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      setAttendanceError('Failed to fetch attendance data');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleAttendanceFilterChange = (key: string, value: any) => {
    setAttendanceFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedAttendanceStudents([]); // Clear selections when filters change
  };

  const handleAttendanceSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttendanceStudents(prev => [...prev, studentId]);
    } else {
      setSelectedAttendanceStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const markBulkAttendance = async () => {
    if (selectedAttendanceStudents.length === 0) {
      alert('Please select students to mark attendance');
      return;
    }

    if (!bulkAttendanceStatus) {
      alert('Please select attendance status');
      return;
    }

    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedAttendanceStudents,
          status: bulkAttendanceStatus,
          seminarDate: attendanceFilters.date,
          notes: attendanceNotes || null,
          seminarTopic: seminarTopic || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Attendance marked for ${data.data.processed} students`);
        setSelectedAttendanceStudents([]);
        setSeminarTopic('');
        setAttendanceNotes('');
        fetchAttendanceData(); // Refresh data
      } else {
        alert('Failed to mark attendance: ' + data.error);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const markIndividualAttendance = async (studentId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceRecords: [{ studentId, status, notes }],
          seminarDate: attendanceFilters.date,
          seminarTopic: seminarTopic || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAttendanceData(); // Refresh data
      } else {
        alert('Failed to mark attendance: ' + data.error);
      }
    } catch (error) {
      console.error('Error marking individual attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  const exportAttendanceToExcel = () => {
    if (!attendanceData?.students?.length) {
      alert('No attendance data to export');
      return;
    }

    const exportData = attendanceData.students.map((student: any) => ({
      'Register Number': student.register_number,
      'Name': student.name || '',
      'Class Year': student.class_year,
      'Selected for Seminar': student.is_selected ? 'Yes' : 'No',
      'Attendance Status': student.attendance_status,
      'Attendance Time': student.attendance_time ? new Date(student.attendance_time).toLocaleString() : '',
      'Seminar Topic': student.seminar_topic || '',
      'Notes': student.attendance_notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    const fileName = `attendance_${attendanceFilters.date}_${attendanceFilters.classYear}.xlsx`;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, fileName);
  };

  // Fine Management functions
  const fetchFineData = async () => {
    setIsLoadingFines(true);
    setFineError('');

    try {
      const params = new URLSearchParams({
        class: fineFilters.classYear,
        status: fineFilters.status,
        type: fineFilters.type
      });

      if (fineFilters.dateFrom) params.set('from', fineFilters.dateFrom);
      if (fineFilters.dateTo) params.set('to', fineFilters.dateTo);

      const response = await fetch(`/api/admin/fines?${params}`);
      const data = await response.json();

      if (data.success) {
        setFineData(data.data);
      } else {
        setFineError(data.error || 'Failed to fetch fine data');
      }
    } catch (error) {
      console.error('Failed to fetch fine data:', error);
      setFineError('Failed to fetch fine data');
    } finally {
      setIsLoadingFines(false);
    }
  };

  const handleFineFilterChange = (key: string, value: any) => {
    setFineFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedFines([]); // Clear selections when filters change
  };

  const handleFineSelection = (fineId: string, checked: boolean) => {
    if (checked) {
      setSelectedFines(prev => [...prev, fineId]);
    } else {
      setSelectedFines(prev => prev.filter(id => id !== fineId));
    }
  };

  const createNewFine = async () => {
    if (!newFine.studentId || !newFine.fineType || !newFine.referenceDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_fine',
          studentId: newFine.studentId,
          fineType: newFine.fineType,
          referenceDate: newFine.referenceDate,
          baseAmount: newFine.baseAmount,
          dailyIncrement: newFine.dailyIncrement,
          reason: newFine.reason
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Fine created successfully!');
        setShowCreateFine(false);
        setNewFine({
          studentId: '',
          fineType: 'seminar_no_booking',
          referenceDate: new Date().toISOString().split('T')[0],
          baseAmount: 10, // Fixed ₹10 per day
          dailyIncrement: 0, // No increments in new system
          reason: ''
        });
        fetchFineData();
      } else {
        alert('Failed to create fine: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating fine:', error);
      alert('Failed to create fine');
    }
  };

  const updateFineStatus = async (fineId: string, status: string, amount?: number) => {
    try {
      const response = await fetch('/api/admin/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_fine',
          fineId,
          paymentStatus: status,
          paidAmount: amount,
          waivedBy: status === 'waived' ? 'admin' : undefined,
          waivedReason: status === 'waived' ? 'Admin waived' : undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchFineData();
      } else {
        alert('Failed to update fine: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating fine:', error);
      alert('Failed to update fine');
    }
  };

  const bulkUpdateFines = async () => {
    if (selectedFines.length === 0) {
      alert('Please select fines to update');
      return;
    }

    const confirmMessage = `Mark ${selectedFines.length} fines as ${bulkAction.replace('mark_', '')}?`;
    if (!confirm(confirmMessage)) return;

    try {
      const promises = selectedFines.map(fineId => {
        const status = bulkAction.replace('mark_', '');
        return updateFineStatus(fineId, status);
      });

      await Promise.all(promises);
      alert(`Updated ${selectedFines.length} fines successfully`);
      setSelectedFines([]);
    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('Failed to update some fines');
    }
  };

  const createBulkFinesForDate = async () => {
    const seminarDate = prompt('Enter seminar date (YYYY-MM-DD) for bulk fine creation:');
    if (!seminarDate) return;

    if (!confirm(`Create fines for all students who didn't book seminar on ${seminarDate}?`)) return;

    try {
      const response = await fetch('/api/admin/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_create',
          seminarDate
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Created ${data.data.created} new fines for students who didn't book`);
        fetchFineData();
      } else {
        alert('Failed to create bulk fines: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating bulk fines:', error);
      alert('Failed to create bulk fines');
    }
  };

  const autoCalculateFines = async () => {
    if (!confirm('Auto-calculate and update all overdue fine amounts?')) return;

    try {
      const response = await fetch('/api/admin/fines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auto_calculate'
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Updated ${data.data.updated} fines with current calculations`);
        fetchFineData();
      } else {
        alert('Failed to auto-calculate fines: ' + data.error);
      }
    } catch (error) {
      console.error('Error auto-calculating fines:', error);
      alert('Failed to auto-calculate fines');
    }
  };

  const exportFinesToExcel = () => {
    if (!fineData?.fines?.length) {
      alert('No fine data to export');
      return;
    }

    const exportData = fineData.fines.map((fine: any) => ({
      'Student Register': fine.unified_students?.register_number || '',
      'Student Name': fine.unified_students?.name || '',
      'Class': fine.unified_students?.class_year || '',
      'Fine Type': fine.fine_type,
      'Reference Date': fine.reference_date,
      'Days Overdue': fine.actual_days_overdue || fine.days_overdue,
      'Base Amount': `₹${fine.base_amount}`,
      'Daily Increment': `₹${fine.daily_increment}`,
      'Current Total': `₹${fine.current_total_amount}`,
      'Payment Status': fine.payment_status,
      'Paid Amount': fine.paid_amount ? `₹${fine.paid_amount}` : '',
      'Created Date': new Date(fine.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    const fileName = `fines_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fines');
    XLSX.writeFile(workbook, fileName);
  };

  // Re-search when filters change
  useEffect(() => {
    if (activeTab === 'students' && isAuthenticated) {
      const timeoutId = setTimeout(() => {
        performStudentSearch();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchFilters, activeTab, isAuthenticated]);

  // Fetch attendance data when filters change
  useEffect(() => {
    if (activeTab === 'attendance' && isAuthenticated) {
      fetchAttendanceData();
    }
  }, [attendanceFilters, activeTab, isAuthenticated]);

  // Fetch fine data when filters change
  useEffect(() => {
    if (activeTab === 'fines' && isAuthenticated) {
      fetchFineData();
    }
  }, [fineFilters, activeTab, isAuthenticated]);
  const fetchBookingAnalytics = async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError('');

    try {
      const params = new URLSearchParams({
        date: selectedDate,
        class: selectedClass
      });

      const response = await fetch(`/api/admin/booking-analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookingAnalytics(data.data);
      } else {
        setAnalyticsError(data.error || 'Failed to fetch booking analytics');
      }
    } catch (error) {
      console.error('Failed to fetch booking analytics:', error);
      setAnalyticsError('Failed to fetch booking analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const exportAnalyticsToExcel = () => {
    if (!bookingAnalytics) {
      alert('No analytics data to export');
      return;
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Students', bookingAnalytics.totalStudents],
      ['Students Booked', bookingAnalytics.totalBooked],
      ['Students Not Booked', bookingAnalytics.totalNotBooked],
      ['Booking Rate', `${((bookingAnalytics.totalBooked / bookingAnalytics.totalStudents) * 100).toFixed(1)}%`],
      ['', ''],
      ['Class Breakdown', ''],
      ['II-IT Total', bookingAnalytics.bookingsByClass['II-IT'].total],
      ['II-IT Booked', bookingAnalytics.bookingsByClass['II-IT'].booked],
      ['II-IT Not Booked', bookingAnalytics.bookingsByClass['II-IT'].notBooked],
      ['III-IT Total', bookingAnalytics.bookingsByClass['III-IT'].total],
      ['III-IT Booked', bookingAnalytics.bookingsByClass['III-IT'].booked],
      ['III-IT Not Booked', bookingAnalytics.bookingsByClass['III-IT'].notBooked],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    // Not booked students sheet
    if (bookingAnalytics.notBookedStudents.length > 0) {
      const notBookedSheet = XLSX.utils.json_to_sheet(bookingAnalytics.notBookedStudents);
      XLSX.utils.book_append_sheet(workbook, notBookedSheet, 'Not Booked Students');
    }

    // Booked students sheet
    if (bookingAnalytics.bookedStudents.length > 0) {
      const bookedSheet = XLSX.utils.json_to_sheet(bookingAnalytics.bookedStudents);
      XLSX.utils.book_append_sheet(workbook, bookedSheet, 'Booked Students');
    }

    const fileName = `booking_analytics_${selectedDate}_${selectedClass}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getBookingRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-black">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="min-h-[70vh] flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-gray-800">
                <Database className="h-6 w-6" />
                Admin Panel
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium pr-12"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <Alert 
                    variant="error" 
                    message={loginError} 
                    className="mt-4"
                  />
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
                >
                  Login to Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-600">Database Management & Assignment Control</p>
            </div>
          </div>
          <Button onClick={handleLogout} className='bg-transparent' variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Database Management
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assignment Management
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Booking Analytics
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Student Management
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendance Tracking
          </button>
          <button
            onClick={() => setActiveTab('fines')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'fines'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Fine Management
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'holidays'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Holiday Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'database' && (
          <>
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Table Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Tables</CardTitle>
                  <CardDescription>Choose which tables to query</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tables.map((table) => (
                    <div key={table.name} className="flex items-start space-x-3">
                      <Checkbox
                        id={table.name}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked: boolean) => 
                          handleTableSelection(table.name, checked)
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label 
                          htmlFor={table.name}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {table.displayName}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {table.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Column Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Columns</CardTitle>
                  <CardDescription>
                    Choose specific columns (leave empty for all)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableColumns.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {availableColumns.map((column) => (
                        <div key={column.fullName} className="flex items-start space-x-3">
                          <Checkbox
                            id={column.fullName}
                            checked={selectedColumns.includes(column.name)}
                            onCheckedChange={(checked: boolean) => 
                              handleColumnSelection(column.name, checked)
                            }
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label 
                              htmlFor={column.fullName}
                              className="text-sm font-medium leading-none"
                            >
                              {column.displayName}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {column.table}.{column.name} ({column.type})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Select tables first to see available columns
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>Data operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={fetchData} 
                    disabled={selectedTables.length === 0 || isLoadingData}
                    className="w-full border border-gray-500"
                  >
                    {isLoadingData ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Fetch Data
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={exportToExcel}
                    className="bg-transparent w-full"
                    disabled={tableData.length === 0}
                    variant="outline"
                   
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>

                  {dataError && (
                    <p className="text-sm text-red-600">{dataError}</p>
                  )}
                  
                  {tableData.length > 0 && (
                    <p className="text-sm text-green-600">
                      {tableData.length} records loaded
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            {tableData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Results</CardTitle>
                  <CardDescription>
                    Showing {tableData.length} records from {selectedTables.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getColumnHeaders().map((header) => (
                            <TableHead key={header} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.slice(0, 100).map((row, index) => (
                          <TableRow key={index}>
                            {getColumnHeaders().map((header) => (
                              <TableCell key={header} className="whitespace-nowrap">
                                {renderValue(row[header])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {tableData.length > 100 && (
                    <p className="text-sm text-gray-500 mt-4">
                      Showing first 100 rows of {tableData.length} total records. 
                      Export to Excel to see all data.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Assignment Management Tab */}
        {activeTab === 'assignments' && (
          <>
            {/* Add Assignment Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Assignment</CardTitle>
                  <CardDescription>Create assignments for students</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showAddAssignment ? (
                    <Button 
                      onClick={() => setShowAddAssignment(true)}
                      className="w-full border border-gray-500"
                    >
                      Add Assignment
                    </Button>
                  ) : (
                    <form onSubmit={handleAddAssignment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Assignment Title *</Label>
                        <Input
                          id="title"
                          type="text"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                          placeholder="Enter assignment title"
                          className="bg-transparent"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                          placeholder="Enter assignment description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class_year">Class Year *</Label>
                        <select
                          id="class_year"
                          value={newAssignment.class_year}
                          onChange={(e) => setNewAssignment({...newAssignment, class_year: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Class Year</option>
                          <option value="II-IT">II-IT (2nd Year)</option>
                          <option value="III-IT">III-IT (3rd Year)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date & Time *</Label>
                        <Input
                          id="due_date"
                          type="datetime-local"
                          value={newAssignment.due_date}
                          onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                          className="bg-transparent"
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" className="flex-1 border border-gray-500">
                          Create Assignment
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowAddAssignment(false)
                            setNewAssignment({ title: '', description: '', class_year: '', due_date: '' })
                          }}
                          className="bg-transparent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Overview</CardTitle>
                  <CardDescription>Quick statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Assignments:</span>
                      <span className="text-lg font-bold">{assignments.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Assignments:</span>
                      <span className="text-lg font-bold text-green-600">
                        {assignments.filter(a => new Date(a.due_date) > new Date()).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Submissions:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0)}
                      </span>
                    </div>
                    <Button 
                      onClick={fetchAssignments} 
                      disabled={isLoadingAssignments}
                      className="w-full bg-transparent"
                      variant="outline"
                    >
                      {isLoadingAssignments ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assignments Table */}
            {assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>All Assignments</CardTitle>
                  <CardDescription>
                    Manage and view assignment submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Class Year</TableHead>
                          <TableHead>Description</TableHead>
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
                            <TableCell className="font-medium">
                              {assignment.title}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                assignment.class_year === 'II-IT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {assignment.class_year}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {assignment.description || '-'}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(assignment.due_date)}
                            </TableCell>
                            <TableCell>
                              {new Date(assignment.due_date) > new Date() ? (
                                <span className="text-green-600 font-medium">Active</span>
                              ) : (
                                <span className="text-red-600 font-medium">Closed</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {assignment.submission_count || 0}
                              </span>
                           
                            </TableCell>
                           
                            <TableCell>
                              {formatDateTime(assignment.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
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

            {assignments.length === 0 && !isLoadingAssignments && (
              <Card>
                <CardContent className="text-center py-12">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
                  <p className="text-sm text-gray-500">Create your first assignment to get started.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Booking Analytics Tab */}
        {activeTab === 'bookings' && (
          <>
            {/* Filters and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Date Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Date Filter
                  </CardTitle>
                  <CardDescription>Select seminar date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent"
                  />
                </CardContent>
              </Card>

              {/* Class Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Class Filter
                  </CardTitle>
                  <CardDescription>Select class to view</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="bg-transparent">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="II-IT">II-IT (2nd Year)</SelectItem>
                      <SelectItem value="III-IT">III-IT (3rd Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* View Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    View Mode
                  </CardTitle>
                  <CardDescription>Select data view</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={analyticsView} onValueChange={(value: 'overview' | 'not-booked' | 'booked') => setAnalyticsView(value)}>
                    <SelectTrigger className="bg-transparent">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Overview</SelectItem>
                      <SelectItem value="not-booked">Not Booked Students</SelectItem>
                      <SelectItem value="booked">Booked Students</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>Data operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={fetchBookingAnalytics} 
                    disabled={isLoadingAnalytics}
                    className="w-full border border-gray-500"
                  >
                    {isLoadingAnalytics ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={exportAnalyticsToExcel}
                    className="bg-transparent w-full"
                    disabled={!bookingAnalytics}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>

                  {analyticsError && (
                    <p className="text-sm text-red-600">{analyticsError}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analytics Content */}
            {bookingAnalytics && (
              <>
                {/* Overview Cards */}
                {analyticsView === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{bookingAnalytics.totalStudents}</div>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedClass === 'all' ? 'All classes' : selectedClass}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-600">Students Booked</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">{bookingAnalytics.totalBooked}</div>
                        <p className="text-sm text-gray-500 mt-1">
                          {bookingAnalytics.totalStudents > 0 ? 
                            `${((bookingAnalytics.totalBooked / bookingAnalytics.totalStudents) * 100).toFixed(1)}% booking rate` : 
                            'No students'
                          }
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-600">Students Not Booked</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-600">{bookingAnalytics.totalNotBooked}</div>
                        <p className="text-sm text-gray-500 mt-1">
                          {bookingAnalytics.totalStudents > 0 ? 
                            `${((bookingAnalytics.totalNotBooked / bookingAnalytics.totalStudents) * 100).toFixed(1)}% not booked` : 
                            'No students'
                          }
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-600">Booking Date</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(selectedDate).toDateString() === new Date().toDateString() ? 'Today' : 'Selected date'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Class Breakdown */}
                {analyticsView === 'overview' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Class-wise Breakdown</CardTitle>
                      <CardDescription>Booking statistics by class for {selectedDate}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* II-IT Stats */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="text-lg font-semibold text-blue-600 mb-3">II-IT (2nd Year)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Students:</span>
                              <span className="font-medium">{bookingAnalytics.bookingsByClass['II-IT'].total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Booked:</span>
                              <span className="font-medium text-green-600">{bookingAnalytics.bookingsByClass['II-IT'].booked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Not Booked:</span>
                              <span className="font-medium text-red-600">{bookingAnalytics.bookingsByClass['II-IT'].notBooked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Booking Rate:</span>
                              <span className={`font-medium ${
                                getBookingRateColor(
                                  (bookingAnalytics.bookingsByClass['II-IT'].booked / bookingAnalytics.bookingsByClass['II-IT'].total) * 100
                                )
                              }`}>
                                {bookingAnalytics.bookingsByClass['II-IT'].total > 0 ? 
                                  `${((bookingAnalytics.bookingsByClass['II-IT'].booked / bookingAnalytics.bookingsByClass['II-IT'].total) * 100).toFixed(1)}%` : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* III-IT Stats */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="text-lg font-semibold text-green-600 mb-3">III-IT (3rd Year)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Students:</span>
                              <span className="font-medium">{bookingAnalytics.bookingsByClass['III-IT'].total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Booked:</span>
                              <span className="font-medium text-green-600">{bookingAnalytics.bookingsByClass['III-IT'].booked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Not Booked:</span>
                              <span className="font-medium text-red-600">{bookingAnalytics.bookingsByClass['III-IT'].notBooked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Booking Rate:</span>
                              <span className={`font-medium ${
                                getBookingRateColor(
                                  (bookingAnalytics.bookingsByClass['III-IT'].booked / bookingAnalytics.bookingsByClass['III-IT'].total) * 100
                                )
                              }`}>
                                {bookingAnalytics.bookingsByClass['III-IT'].total > 0 ? 
                                  `${((bookingAnalytics.bookingsByClass['III-IT'].booked / bookingAnalytics.bookingsByClass['III-IT'].total) * 100).toFixed(1)}%` : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Not Booked Students Table */}
                {analyticsView === 'not-booked' && bookingAnalytics.notBookedStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Students Not Booked</CardTitle>
                      <CardDescription>
                        {bookingAnalytics.notBookedStudents.length} students haven't booked for {selectedDate}
                        {selectedClass !== 'all' && ` (${selectedClass} only)`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Register Number</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Class</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookingAnalytics.notBookedStudents.map((student: any) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.register_number}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    student.class_year === 'II-IT'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {student.class_year}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Booked Students Table */}
                {analyticsView === 'booked' && bookingAnalytics.bookedStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Students Booked</CardTitle>
                      <CardDescription>
                        {bookingAnalytics.bookedStudents.length} students have booked for {selectedDate}
                        {selectedClass !== 'all' && ` (${selectedClass} only)`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Register Number</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Seminar Topic</TableHead>
                              <TableHead>Booking Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookingAnalytics.bookedStudents.map((student: any) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.register_number}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    student.class_year === 'II-IT'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {student.class_year}
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {student.seminar_topic || 'Not specified'}
                                </TableCell>
                                <TableCell>
                                  {student.booking_time ? 
                                    new Date(student.booking_time).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Unknown'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* No Data Messages */}
                {analyticsView === 'not-booked' && bookingAnalytics.notBookedStudents.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All Students Have Booked!</h3>
                      <p className="text-sm text-gray-500">
                        Great! All students {selectedClass !== 'all' && `in ${selectedClass} `}have booked their seminar slots for {selectedDate}.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {analyticsView === 'booked' && bookingAnalytics.bookedStudents.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                      <p className="text-sm text-gray-500">
                        No students {selectedClass !== 'all' && `in ${selectedClass} `}have booked for {selectedDate} yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Loading State */}
            {isLoadingAnalytics && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics...</h3>
                  <p className="text-sm text-gray-500">Please wait while we fetch the booking data.</p>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {!bookingAnalytics && !isLoadingAnalytics && !analyticsError && (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                  <p className="text-sm text-gray-500">Click refresh to load booking analytics for the selected date and class.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Fine Management Tab */}
        {activeTab === 'fines' && (
          <>
            {/* Fine Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <CardDescription>Filter fines by various criteria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Class Year</Label>
                    <Select value={fineFilters.classYear} onValueChange={(value) => handleFineFilterChange('classYear', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="II-IT">II-IT (2nd Year)</SelectItem>
                        <SelectItem value="III-IT">III-IT (3rd Year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Status</Label>
                    <Select value={fineFilters.status} onValueChange={(value) => handleFineFilterChange('status', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="waived">Waived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operations</CardTitle>
                  <CardDescription>Create and manage fines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setShowCreateFine(true)}
                    className="w-full border border-gray-500"
                  >
                    Create New Fine
                  </Button>
                  <Button 
                    onClick={createBulkFinesForDate}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Bulk Create Fines
                  </Button>
                  <Button 
                    onClick={exportFinesToExcel}
                    className="bg-transparent w-full"
                    disabled={!fineData?.fines?.length}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Fines
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Fine Summary */}
            {fineData && (
              <Card>
                <CardHeader>
                  <CardTitle>Fine Summary</CardTitle>
                  <CardDescription>Overview of fine statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{fineData.summary.total_fines}</div>
                      <div className="text-sm text-gray-600">Total Fines</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{fineData.summary.pending_fines}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{fineData.summary.paid_fines}</div>
                      <div className="text-sm text-gray-600">Paid</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">₹{fineData.summary.pending_amount}</div>
                      <div className="text-sm text-gray-600">Pending Amount</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoadingFines && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Fine Data...</h3>
                  <p className="text-sm text-gray-500">Please wait while we fetch fine records.</p>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {!fineData && !isLoadingFines && !fineError && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Fine Management</h3>
                    <p className="text-sm">Use the operations above to manage student fines.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Student Management Tab */}
        {activeTab === 'students' && (
          <>
            {/* Search Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Students</CardTitle>
                  <CardDescription>Search by name, register number, email, or mobile</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchFilters.query}
                    onChange={(e) => handleSearchFilterChange('query', e.target.value)}
                    className="bg-transparent"
                  />
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <CardDescription>Filter by class, verification, etc.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Class Year</Label>
                    <Select value={searchFilters.classYear} onValueChange={(value) => handleSearchFilterChange('classYear', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="II-IT">II-IT (2nd Year)</SelectItem>
                        <SelectItem value="III-IT">III-IT (3rd Year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email Status</Label>
                    <Select 
                      value={searchFilters.emailVerified === undefined ? 'all' : String(searchFilters.emailVerified)} 
                      onValueChange={(value) => handleSearchFilterChange('emailVerified', value === 'all' ? undefined : value === 'true')}
                    >
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="true">Email Verified</SelectItem>
                        <SelectItem value="false">Email Not Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced</CardTitle>
                  <CardDescription>Fine status and activity filters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Fine Status</Label>
                    <Select value={searchFilters.fineStatus} onValueChange={(value) => handleSearchFilterChange('fineStatus', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        <SelectItem value="has_fines">Has Pending Fines</SelectItem>
                        <SelectItem value="no_fines">No Fines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login (Days)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 7 for last week"
                      value={searchFilters.lastLoginDays || ''}
                      onChange={(e) => handleSearchFilterChange('lastLoginDays', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="bg-transparent"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>Search operations and export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={performStudentSearch} 
                    disabled={isLoadingSearch}
                    className="w-full border border-gray-500"
                  >
                    {isLoadingSearch ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Search Students
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={exportStudentsToExcel}
                    className="bg-transparent w-full"
                    disabled={!searchResults?.students?.length}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>

                  {searchError && (
                    <p className="text-sm text-red-600">{searchError}</p>
                  )}
                  
                  {searchResults && (
                    <div className="text-sm text-green-600 space-y-1">
                      <p>Found: {searchResults.summary.filtered} students</p>
                      <p>Total Fines: ₹{searchResults.summary.totalFineAmount}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Search Results Summary */}
            {searchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Summary</CardTitle>
                  <CardDescription>Overview of search results and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{searchResults.summary.filtered}</div>
                      <div className="text-sm text-gray-600">Total Found</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{searchResults.summary.byClass['II-IT']}</div>
                      <div className="text-sm text-gray-600">II-IT Students</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{searchResults.summary.byClass['III-IT']}</div>
                      <div className="text-sm text-gray-600">III-IT Students</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{searchResults.summary.emailVerified}</div>
                      <div className="text-sm text-gray-600">Email Verified</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{searchResults.summary.withFines}</div>
                      <div className="text-sm text-gray-600">With Fines</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">₹{searchResults.summary.totalFineAmount}</div>
                      <div className="text-sm text-gray-600">Total Fines</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Students Table */}
            {searchResults?.students?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Student Records</CardTitle>
                      <CardDescription>
                        Showing {searchResults.students.length} of {searchResults.summary.filtered} students
                        {selectedStudents.length > 0 && ` • ${selectedStudents.length} selected`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Select 
                        value={searchFilters.sortBy} 
                        onValueChange={(value) => handleSearchFilterChange('sortBy', value)}
                      >
                        <SelectTrigger className="w-40 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Date Joined</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="register_number">Register Number</SelectItem>
                          <SelectItem value="total_fine_amount">Fine Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSearchFilterChange('sortOrder', searchFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="bg-transparent"
                      >
                        {searchFilters.sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedStudents.length === searchResults.students.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedStudents(searchResults.students.map((s: any) => s.id));
                                } else {
                                  setSelectedStudents([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Register Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Fines</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Registration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.students.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.register_number}</TableCell>
                            <TableCell>{student.name || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{student.email || 'N/A'}</TableCell>
                            <TableCell>{student.mobile || 'N/A'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.class_year === 'II-IT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {student.class_year}
                              </span>
                            </TableCell>
                            <TableCell>
                              {student.email_verified ? (
                                <span className="text-green-600 text-sm">✓ Verified</span>
                              ) : (
                                <span className="text-red-600 text-sm">✗ Not Verified</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.computed_total_fines > 0 ? (
                                <span className="text-red-600 font-medium">₹{student.computed_total_fines}</span>
                              ) : (
                                <span className="text-green-600">₹0</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.computed_days_since_login !== null ? (
                                <span className={`text-sm ${
                                  student.computed_days_since_login <= 7 ? 'text-green-600' :
                                  student.computed_days_since_login <= 30 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {student.computed_days_since_login} days ago
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {student.computed_registration_types?.map((type: string) => (
                                  <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {type}
                                  </span>
                                )) || <span className="text-gray-500 text-sm">None</span>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {searchResults.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Page {searchResults.pagination.page} of {searchResults.pagination.totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearchFilterChange('page', Math.max(1, searchFilters.page - 1))}
                          disabled={searchFilters.page <= 1}
                          className="bg-transparent"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearchFilterChange('page', Math.min(searchResults.pagination.totalPages, searchFilters.page + 1))}
                          disabled={searchFilters.page >= searchResults.pagination.totalPages}
                          className="bg-transparent"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoadingSearch && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Searching Students...</h3>
                  <p className="text-sm text-gray-500">Please wait while we search through the student database.</p>
                </CardContent>
              </Card>
            )}

            {/* No Results State */}
            {searchResults?.students?.length === 0 && !isLoadingSearch && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-sm text-gray-500">
                    No students match your search criteria. Try adjusting your filters or search terms.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {!searchResults && !isLoadingSearch && !searchError && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Student Management</h3>
                  <p className="text-sm text-gray-500">Use the search filters above to find and manage student records.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Attendance Tracking Tab */}
        {activeTab === 'attendance' && (
          <>
            {/* Attendance Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Date & Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Date</CardTitle>
                  <CardDescription>Choose seminar date for attendance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Seminar Date</Label>
                    <Input
                      type="date"
                      value={attendanceFilters.date}
                      onChange={(e) => handleAttendanceFilterChange('date', e.target.value)}
                      className="bg-transparent"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Class Filter</Label>
                    <Select value={attendanceFilters.classYear} onValueChange={(value) => handleAttendanceFilterChange('classYear', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="II-IT">II-IT (2nd Year)</SelectItem>
                        <SelectItem value="III-IT">III-IT (3rd Year)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Status Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Filter</CardTitle>
                  <CardDescription>Filter by attendance status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-sm font-medium">Attendance Status</Label>
                    <Select value={attendanceFilters.status} onValueChange={(value) => handleAttendanceFilterChange('status', value)}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Actions</CardTitle>
                  <CardDescription>Mark attendance for multiple students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Mark Selected As</Label>
                    <Select value={bulkAttendanceStatus} onValueChange={setBulkAttendanceStatus}>
                      <SelectTrigger className="bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={markBulkAttendance}
                    disabled={selectedAttendanceStudents.length === 0}
                    className="w-full border border-gray-500"
                  >
                    Mark {selectedAttendanceStudents.length} Students
                  </Button>
                </CardContent>
              </Card>

              {/* Seminar Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seminar Details</CardTitle>
                  <CardDescription>Add seminar information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Seminar Topic</Label>
                    <Input
                      type="text"
                      placeholder="Enter seminar topic"
                      value={seminarTopic}
                      onChange={(e) => setSeminarTopic(e.target.value)}
                      className="bg-transparent"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <textarea
                      placeholder="Additional notes..."
                      value={attendanceNotes}
                      onChange={(e) => setAttendanceNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={2}
                    />
                  </div>
                  <Button 
                    onClick={exportAttendanceToExcel}
                    className="bg-transparent w-full"
                    disabled={!attendanceData?.students?.length}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Attendance
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Summary */}
            {attendanceData && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary - {attendanceFilters.date}</CardTitle>
                  <CardDescription>
                    {attendanceFilters.classYear !== 'all' ? `${attendanceFilters.classYear} class only` : 'All classes'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{attendanceData.summary.selected}</div>
                      <div className="text-sm text-gray-600">Selected for Seminar</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{attendanceData.summary.present}</div>
                      <div className="text-sm text-gray-600">Present</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{attendanceData.summary.absent}</div>
                      <div className="text-sm text-gray-600">Absent</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{attendanceData.summary.excused}</div>
                      <div className="text-sm text-gray-600">Excused</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{attendanceData.summary.pending}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {attendanceData.summary.present > 0 ? 
                          `${((attendanceData.summary.present / attendanceData.summary.selected) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Attendance Rate</div>
                    </div>
                  </div>

                  {/* Class-wise breakdown */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-600 mb-3">II-IT (2nd Year)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Selected:</span>
                          <span className="font-medium">{attendanceData.summary.byClass['II-IT'].selected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Present:</span>
                          <span className="font-medium text-green-600">{attendanceData.summary.byClass['II-IT'].present}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent:</span>
                          <span className="font-medium text-red-600">{attendanceData.summary.byClass['II-IT'].absent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-semibold text-green-600 mb-3">III-IT (3rd Year)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Selected:</span>
                          <span className="font-medium">{attendanceData.summary.byClass['III-IT'].selected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Present:</span>
                          <span className="font-medium text-green-600">{attendanceData.summary.byClass['III-IT'].present}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Absent:</span>
                          <span className="font-medium text-red-600">{attendanceData.summary.byClass['III-IT'].absent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendance Table */}
            {attendanceData?.students?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Student Attendance</CardTitle>
                      <CardDescription>
                        Showing {attendanceData.students.length} students for {attendanceFilters.date}
                        {selectedAttendanceStudents.length > 0 && ` • ${selectedAttendanceStudents.length} selected`}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={fetchAttendanceData} 
                      disabled={isLoadingAttendance}
                      variant="outline"
                      className="bg-transparent"
                    >
                      {isLoadingAttendance ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedAttendanceStudents.length === attendanceData.students.filter((s: any) => s.is_selected).length && attendanceData.students.filter((s: any) => s.is_selected).length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAttendanceStudents(attendanceData.students.filter((s: any) => s.is_selected).map((s: any) => s.id));
                                } else {
                                  setSelectedAttendanceStudents([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Register Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Selected</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time Marked</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.students.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAttendanceStudents.includes(student.id)}
                                onCheckedChange={(checked) => handleAttendanceSelection(student.id, checked as boolean)}
                                disabled={!student.is_selected}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.register_number}</TableCell>
                            <TableCell>{student.name || 'N/A'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.class_year === 'II-IT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {student.class_year}
                              </span>
                            </TableCell>
                            <TableCell>
                              {student.is_selected ? (
                                <span className="text-green-600 text-sm font-medium">✓ Selected</span>
                              ) : (
                                <span className="text-gray-500 text-sm">Not Selected</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.attendance_status === 'present' ? 'bg-green-100 text-green-800' :
                                student.attendance_status === 'absent' ? 'bg-red-100 text-red-800' :
                                student.attendance_status === 'excused' ? 'bg-yellow-100 text-yellow-800' :
                                student.attendance_status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {student.attendance_status.replace('_', ' ').toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {student.attendance_time ? (
                                <span className="text-sm text-gray-600">
                                  {new Date(student.attendance_time).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.is_selected && (
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    onClick={() => markIndividualAttendance(student.id, 'present')}
                                    className="h-6 px-2 text-xs bg-green-100 text-green-800 hover:bg-green-200"
                                    variant="outline"
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => markIndividualAttendance(student.id, 'absent')}
                                    className="h-6 px-2 text-xs bg-red-100 text-red-800 hover:bg-red-200"
                                    variant="outline"
                                  >
                                    Absent
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoadingAttendance && (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Attendance Data...</h3>
                  <p className="text-sm text-gray-500">Please wait while we fetch attendance records.</p>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {attendanceError && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Attendance</h3>
                    <p className="text-sm">{attendanceError}</p>
                  </div>
                  <Button onClick={fetchAttendanceData} variant="outline" className="bg-transparent">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {!attendanceData && !isLoadingAttendance && !attendanceError && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Tracking</h3>
                  <p className="text-sm text-gray-500">Select a date above to view and manage student attendance records.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Holiday Management Tab */}
        {activeTab === 'holidays' && (
          <HolidayManagement />
        )}
      </div>
    </div>
  );
}