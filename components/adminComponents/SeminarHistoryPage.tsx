"use client";

import React from "react";
import ModernSeminarHistory from "@/components/admin/ModernSeminarHistory";

export default function SeminarHistoryPage() {
  const formatDateTime = (d: string) => new Date(d).toLocaleString();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernSeminarHistory isLoading={false} onRefresh={() => {}} formatDateTime={formatDateTime} />
    </div>
  );
}


