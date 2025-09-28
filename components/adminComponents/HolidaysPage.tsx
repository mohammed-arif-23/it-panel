"use client";

import React from "react";
import ModernHolidayManagement from "@/components/admin/ModernHolidayManagement";
import { exportArrayToExcel } from "@/lib/exportExcel";

export default function HolidaysPage() {
  const formatDateTime = (d: string) => new Date(d).toLocaleString();
  const onExport = (rows: any[] = [], filename: string = 'holidays') => {
    exportArrayToExcel(rows, filename);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernHolidayManagement onRefresh={() => {}} onExport={onExport} formatDateTime={formatDateTime} />
    </div>
  );
}


