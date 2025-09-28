"use client";

import React from "react";
import ModernStudentTableManagement from "@/components/admin/ModernStudentTableManagement";
import { exportArrayToExcel } from "@/lib/exportExcel";

export default function DatabasePage() {
  const onExport = (rows: any[], filename: string) => {
    exportArrayToExcel(rows, filename);
  };
  const formatDateTime = (d: string) => new Date(d).toLocaleString();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernStudentTableManagement onExport={onExport} formatDateTime={formatDateTime} />
    </div>
  );
}


