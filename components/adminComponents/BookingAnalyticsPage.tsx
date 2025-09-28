"use client";

import React from "react";
import ModernBookingAnalytics from "@/components/admin/ModernBookingAnalytics";
import { exportArrayToExcel } from "@/lib/exportExcel";

export default function BookingAnalyticsPage() {
  const formatDateTime = (d: string) => new Date(d).toLocaleString();
  const onExport = (data: any[], filename: string) => {
    exportArrayToExcel(data, filename);
  };

  const fetchBookings = async () => {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernBookingAnalytics
        isLoading={false}
        onRefresh={fetchBookings}
        onExport={onExport}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}


