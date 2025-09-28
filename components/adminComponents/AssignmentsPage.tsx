"use client";

import React, { useEffect, useState } from "react";
import ModernAssignmentManagement from "@/components/admin/ModernAssignmentManagement";

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

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/assignments");
      const data = await response.json();
      setAssignments(data.data || []);
    } catch (error) {
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAssignment = async (assignment: any) => {
    const response = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment),
    });
    if (response.ok) fetchAssignments();
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    const response = await fetch(`/api/admin/assignments?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) fetchAssignments();
  };

  const exportToExcel = (data: any[], filename: string) => {
    // defer to top-level admin for actual export on this page; noop
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernAssignmentManagement
        assignments={assignments}
        isLoading={isLoading}
        onRefresh={fetchAssignments}
        onAddAssignment={handleAddAssignment}
        onDeleteAssignment={handleDeleteAssignment}
        formatDateTime={formatDateTime}
        exportToExcel={exportToExcel}
      />
    </div>
  );
}


