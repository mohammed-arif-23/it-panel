"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  RefreshCw,
  History,
  Users,
  BookOpen,
  Clock,
  RotateCcw,
} from "lucide-react";

interface Student {
  id: string;
  register_number: string;
  name: string;
  email: string;
  class_year: string;
}

interface SeminarBooking {
  id: string;
  student_id: string;
  booking_date: string;
  created_at: string;
  unified_students: Student;
}

interface SeminarSelection {
  id: string;
  student_id: string;
  seminar_date: string;
  selected_at: string;
  seminar_topic?: string | null;
  unified_students: Student;
}

interface SeminarReschedule {
  id: string;
  student_id: string;
  register_number: string;
  name: string;
  class_year: string;
  original_date: string;
  new_date: string;
  reason: string;
  created_at: string;
}

interface SeminarHistoryData {
  bookings: SeminarBooking[];
  selections: SeminarSelection[];
  reschedules: SeminarReschedule[];
}

interface ModernSeminarHistoryProps {
  isLoading: boolean;
  onRefresh: () => void;
  formatDateTime: (date: string) => string;
}

export default function ModernSeminarHistory({
  isLoading,
  onRefresh,
  formatDateTime,
}: ModernSeminarHistoryProps) {
  const [selectedClass, setSelectedClass] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState<
    "bookings" | "selections" | "reschedules"
  >("bookings");
  const [seminarHistory, setSeminarHistory] =
    useState<SeminarHistoryData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchSeminarHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        class: selectedClass,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const response = await fetch(`/api/admin/seminar-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setSeminarHistory(data.data);
      } else {
        console.error("Seminar history API error:", data.error);
        setSeminarHistory(null);
      }
    } catch (error) {
      console.error("Failed to fetch seminar history:", error);
      setSeminarHistory(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSeminarHistory();
  }, [selectedClass, startDate, endDate]);

  const handleRefresh = () => {
    fetchSeminarHistory();
    onRefresh();
  };

  const handleExport = () => {
    if (!seminarHistory) return;

    let exportData: any[] = [];
    let filename = "seminar_history";

    switch (viewMode) {
      case "bookings":
        exportData = seminarHistory.bookings.map((booking) => ({
          "Register Number": booking.unified_students.register_number,
          Name: booking.unified_students.name,
          Email: booking.unified_students.email,
          Class: booking.unified_students.class_year,
          "Booking Date": booking.booking_date,
          "Created At": formatDateTime(booking.created_at),
        }));
        filename = "seminar_bookings";
        break;
      case "selections":
        exportData = seminarHistory.selections.map((selection) => ({
          "Register Number": selection.unified_students.register_number,
          Name: selection.unified_students.name,
          Email: selection.unified_students.email,
          Class: selection.unified_students.class_year,
          "Seminar Topic": selection.seminar_topic || "-",
          "Seminar Date": selection.seminar_date,
          "Selected At": formatDateTime(selection.selected_at),
        }));
        filename = "seminar_selections";
        break;
      case "reschedules":
        exportData = seminarHistory.reschedules.map((reschedule) => ({
          "Register Number": reschedule.register_number,
          Name: reschedule.name,
          Class: reschedule.class_year,
          "Original Date": reschedule.original_date,
          "New Date": reschedule.new_date,
          Reason: reschedule.reason,
          "Rescheduled At": formatDateTime(reschedule.created_at),
        }));
        filename = "seminar_reschedules";
        break;
    }

    // Use the export function passed from parent
    const exportToExcel = (data: any[], fileName: string) => {
      if (typeof window !== "undefined") {
        import("xlsx").then((XLSX) => {
          if (data.length === 0) {
            alert("No data to export");
            return;
          }
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          const fileNameWithDate = `${fileName}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
          XLSX.writeFile(workbook, fileNameWithDate);
        });
      }
    };

    exportToExcel(exportData, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seminar History</h2>
          <p className="text-gray-600">
            View complete seminar booking, selection, and reschedule history
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="text-gray-700"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <History className="h-5 w-5 mr-2" />
            Filter Options
          </CardTitle>
          <CardDescription className="text-gray-600">
            Filter seminar history by class and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {seminarHistory && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {seminarHistory.bookings.length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Selections</p>
                  <p className="text-2xl font-bold text-green-600">
                    {seminarHistory.selections.length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reschedules</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {seminarHistory.reschedules.length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Mode Selection and Export */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "bookings" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("bookings")}
                className={
                  viewMode === "bookings" ? "bg-blue-600 hover:bg-blue-700" : ""
                }
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Bookings ({seminarHistory?.bookings.length || 0})
              </Button>
              <Button
                variant={viewMode === "selections" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("selections")}
                className={
                  viewMode === "selections"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                <Users className="h-4 w-4 mr-1" />
                Selections ({seminarHistory?.selections.length || 0})
              </Button>
              <Button
                variant={viewMode === "reschedules" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("reschedules")}
                className={
                  viewMode === "reschedules"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : ""
                }
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reschedules ({seminarHistory?.reschedules.length || 0})
              </Button>
            </div>

            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">
            {viewMode === "bookings"
              ? "Seminar Bookings"
              : viewMode === "selections"
              ? "Seminar Selections"
              : "Seminar Reschedules"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {viewMode === "bookings"
              ? "Students who booked seminar slots"
              : viewMode === "selections"
              ? "Students who selected seminar dates"
              : "Students who rescheduled seminars"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : seminarHistory ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700">
                    Register Number
                  </TableHead>
                  <TableHead className="text-gray-700">Name</TableHead>
                  <TableHead className="text-gray-700">Class</TableHead>
                  {viewMode === "bookings" && (
                    <>
                      <TableHead className="text-gray-700">Email</TableHead>
                      <TableHead className="text-gray-700">
                        Booking Date
                      </TableHead>
                      <TableHead className="text-gray-700">
                        Created At
                      </TableHead>
                    </>
                  )}
                  {viewMode === "selections" && (
                    <>
                      <TableHead className="text-gray-700">Email</TableHead>
                      <TableHead className="text-gray-700">
                        Seminar Topic
                      </TableHead>
                      <TableHead className="text-gray-700">
                        Seminar Date
                      </TableHead>
                      <TableHead className="text-gray-700">
                        Selected At
                      </TableHead>
                    </>
                  )}
                  {viewMode === "reschedules" && (
                    <>
                      <TableHead className="text-gray-700">
                        Original Date
                      </TableHead>
                      <TableHead className="text-gray-700">New Date</TableHead>
                      <TableHead className="text-gray-700">Reason</TableHead>
                      <TableHead className="text-gray-700">
                        Rescheduled At
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewMode === "bookings" &&
                  seminarHistory.bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="text-gray-900">
                        {booking.unified_students.register_number}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {booking.unified_students.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200"
                        >
                          {booking.unified_students.class_year}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {booking.unified_students.email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {booking.booking_date}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDateTime(booking.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}

                {viewMode === "selections" &&
                  seminarHistory.selections.map((selection) => (
                    <TableRow key={selection.id}>
                      <TableCell className="text-gray-900">
                        {selection.unified_students.register_number}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {selection.unified_students.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200"
                        >
                          {selection.unified_students.class_year}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {selection.unified_students.email}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {selection.seminar_topic || "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {selection.seminar_date}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDateTime(selection.selected_at)}
                      </TableCell>
                    </TableRow>
                  ))}

                {viewMode === "reschedules" &&
                  seminarHistory.reschedules.map((reschedule) => (
                    <TableRow key={reschedule.id}>
                      <TableCell className="text-gray-900">
                        {reschedule.register_number}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {reschedule.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200"
                        >
                          {reschedule.class_year}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {reschedule.original_date}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {reschedule.new_date}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {reschedule.reason}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDateTime(reschedule.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                No seminar history data available
              </p>
              <p className="text-sm text-gray-400">
                Check your database connection or adjust your filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
