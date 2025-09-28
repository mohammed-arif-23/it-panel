"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Eye, EyeOff, Database } from "lucide-react";
import * as XLSX from "xlsx";
import ModernAdminNavbar from "@/components/admin/ModernAdminNavbar";
import ModernAssignmentManagement from "@/components/admin/ModernAssignmentManagement";
import ModernStudentRegistration from "@/components/admin/ModernStudentRegistration";
import ModernFineManagement from "@/components/admin/ModernFineManagement";
import ModernBookingAnalytics from "@/components/admin/ModernBookingAnalytics";
import ModernHolidayManagement from "@/components/admin/ModernHolidayManagement";
import ModernSeminarHistory from "@/components/admin/ModernSeminarHistory";
import ModernStudentTableManagement from "@/components/admin/ModernStudentTableManagement";
import ModernFineStudentManagement from "@/components/admin/ModernFineStudentManagement";

interface Assignment {
  id: string;
  title: string;
  description: string;
  class_year: string;
  due_date: string;
  created_at: string;
  submission_count?: number;
  graded_count?: number;
  average_marks?: number;
}

interface Student {
  id: string;
  register_number: string;
  name: string;
  email: string;
  class_year: string;
  email_verified?: boolean;
  mobile?: string;
}

interface Fine {
  id: string;
  student_id: string;
  fine_type: string;
  reference_date: string;
  base_amount: number;
  payment_status: string;
  paid_amount?: number;
  created_at: string;
  unified_students?: Student;
}

export default function AdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    | "assignments"
    | "detect-assignments"
    | "registration"
    | "bookings"
    | "holidays"
    | "Seminar History"
    | "fines"
    | "fine-students"
    | "database"
  >("assignments");

  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Assignment Management States
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Fine Management States
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoadingFines, setIsLoadingFines] = useState(false);
  const [fineFilters, setFineFilters] = useState({
    class: "all",
    status: "all",
    type: "all",
  });

  // Booking Analytics States
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "assignments") {
        fetchAssignments();
      } else if (activeTab === "fines") {
        fetchFines();
      } else if (activeTab === "bookings") {
        fetchBookings();
      }
      // Note: holidays component manages its own data fetching
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "fines") {
      fetchFines();
    }
  }, [fineFilters]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/admin/auth");
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      // Auth check failed - handling silently
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setUsername("");
      setPassword("");
      router.push("/");
    } catch (error) {
      // Logout failed - handling silently
    }
  };

  // Assignment Management Functions
  const fetchAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await fetch("/api/admin/assignments");
      const data = await response.json();
      setAssignments(data.data || []);
    } catch (error) {
      // Failed to fetch assignments - handling silently
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleAddAssignment = async (assignment: any) => {
    if (!assignment.title || !assignment.class_year || !assignment.due_date) {
      alert("Title, class year, and due date are required");
      return;
    }

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignment),
      });

      if (response.ok) {
        fetchAssignments();
        alert("Assignment added successfully!");
      } else {
        const errorData = await response.json();
        alert("Failed to add assignment: " + errorData.error);
      }
    } catch (error) {
      // Error adding assignment - handling silently
      alert("Failed to add assignment");
    }
  };

  const handleDeleteAssignment = async (
    assignmentId: string,
    assignmentTitle: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${assignmentTitle}"? This will also delete all submissions for this assignment.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/assignments?id=${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchAssignments();
        alert("Assignment deleted successfully!");
      } else {
        const errorData = await response.json();
        alert("Failed to delete assignment: " + errorData.error);
      }
    } catch (error) {
      // Error deleting assignment - handling silently
      alert("Failed to delete assignment");
    }
  };

  // Fine Management Functions
  const fetchFines = async () => {
    setIsLoadingFines(true);
    try {
      const params = new URLSearchParams(fineFilters);
      const response = await fetch(`/api/admin/fines?${params}`);
      const data = await response.json();

      if (data.success) {
        setFines(data.data?.fines || []);
      } else {
        // Fines API error - handling silently
        setFines([]);
      }
    } catch (error) {
      // Failed to fetch fines - handling silently
      setFines([]);
    } finally {
      setIsLoadingFines(false);
    }
  };

  const handleUpdateFine = async (
    fineId: string,
    status: string,
    amount?: number
  ) => {
    try {
      const response = await fetch("/api/admin/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_fine",
          fineId,
          paymentStatus: status,
          paidAmount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchFines();
        alert("Fine updated successfully!");
      } else {
        alert(`Failed to update fine: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      // Failed to update fine - handling silently
      alert("Failed to update fine. Please try again.");
    }
  };

  const handleAddFine = async (fineData: any) => {
    if (!fineData.student_id || !fineData.student_id.trim()) {
      alert("Please select a student");
      return;
    }

    try {
      const response = await fetch("/api/admin/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_manual_fine",
          ...fineData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        fetchFines();
        alert("Fine created successfully!");
      } else {
        alert(`Failed to create fine: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      // Failed to create fine - handling silently
      alert("Failed to create fine. Please try again.");
    }
  };

  // Booking Management Functions
  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/booking-analytics");
      const data = await response.json();
      if (data.success) {
        setBookings(data.data?.bookedStudents || []);
      }
    } catch (error) {
      // Failed to fetch bookings - handling silently
    }
  };

  // Export Functions
  const exportToExcel = (data: any[], filename: string) => {
    const safeData = data && Array.isArray(data) ? data : [];
    const worksheet = XLSX.utils.json_to_sheet(
      safeData.length > 0
        ? safeData
        : [{ Message: "No data for selected filters" }]
    );
    const workbook = XLSX.utils.book_new();

    const fileName = `${filename}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, fileName);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: 'Asia/Kolkata'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-lg text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Database className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{loginError}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {isLoggingIn ? (
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Database className="h-5 w-5 mr-2" />
                )}
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernAdminNavbar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions - flat cards, Android-like */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'assignments', label: 'Assignments', icon: BookOpen },
              { id: 'detect-assignments', label: 'Detect', icon: Search },
              { id: 'registration', label: 'Registration', icon: UserPlus },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'holidays', label: 'Holidays', icon: CalendarDays },
              { id: 'Seminar History', label: 'History', icon: Users },
              { id: 'fines', label: 'Fines', icon: DollarSign },
              { id: 'fine-students', label: 'Fine Students', icon: DollarSign },
              { id: 'database', label: 'Database', icon: Database },
            ].map((tile) => (
              <button
                key={tile.id}
                onClick={() => setActiveTab(tile.id as any)}
                className={`group text-left h-full rounded-xl border ${activeTab === tile.id ? 'border-blue-600' : 'border-gray-200'} bg-white p-4 shadow-sm hover:shadow-md transition-all duration-150 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    {tile.icon && <tile.icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{tile.label}</div>
                    <div className="text-xs text-gray-500">Open {tile.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "assignments" && (
          <ModernAssignmentManagement
            assignments={assignments}
            isLoading={isLoadingAssignments}
            onRefresh={fetchAssignments}
            onAddAssignment={handleAddAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            formatDateTime={formatDateTime}
            exportToExcel={exportToExcel}
          />
        )}

        {activeTab === "detect-assignments" && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Assignment plagiarism detection is now available as a separate page.
            </p>
            <Button 
              onClick={() => window.open('/admin/detect-assignments', '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Open Detection Tool
            </Button>
          </div>
        )}

        {activeTab === "registration" && (
          <ModernStudentRegistration
            onRefresh={() => {
              // Optionally refresh other data when a new student is registered
              console.log('Student registered successfully');
            }}
          />
        )}

        {activeTab === "fines" && (
          <ModernFineManagement
            fines={fines}
            isLoading={isLoadingFines}
            filters={fineFilters}
            onFiltersChange={setFineFilters}
            onRefresh={fetchFines}
            onAddFine={handleAddFine}
            onUpdateFine={handleUpdateFine}
            onExport={() => exportToExcel(fines, "fines")}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "bookings" && (
          <ModernBookingAnalytics
            isLoading={false}
            onRefresh={fetchBookings}
            onExport={(data, filename) => exportToExcel(data, filename)}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "fine-students" && (
          <ModernFineStudentManagement />
        )}

        {activeTab === "holidays" && (
          <ModernHolidayManagement
            onRefresh={() => {}}
            onExport={() => exportToExcel([], "holidays")}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "Seminar History" && (
          <ModernSeminarHistory
            isLoading={false}
            onRefresh={() => {}}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "database" && (
          <ModernStudentTableManagement
            onRefresh={() => {
              console.log('Student database refreshed');
            }}
            onExport={exportToExcel}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </div>
  );
}
