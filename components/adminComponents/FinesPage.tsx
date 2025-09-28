"use client";

import React, { useEffect, useState } from "react";
import ModernFineManagement from "@/components/admin/ModernFineManagement";
import { exportArrayToExcel } from "@/lib/exportExcel";

interface Fine {
  id: string;
  student_id: string;
  fine_type: string;
  reference_date: string;
  base_amount: number;
  payment_status: string;
  paid_amount?: number;
  created_at: string;
}

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ class: "all", status: "all", type: "all" });

  useEffect(() => {
    fetchFines();
  }, [filters]);

  const fetchFines = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/admin/fines?${params}`);
      const data = await response.json();
      setFines(data.data?.fines || []);
    } catch (e) {
      setFines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFine = async (fineData: any) => {
    await fetch("/api/admin/fines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_manual_fine", ...fineData }),
    });
    fetchFines();
  };

  const handleUpdateFine = async (fineId: string, status: string, amount?: number) => {
    await fetch("/api/admin/fines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_fine", fineId, paymentStatus: status, paidAmount: amount }),
    });
    fetchFines();
  };

  const exportToExcel = (data: any[], filename: string) => {
    exportArrayToExcel(data, filename);
  };
  const formatDateTime = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernFineManagement
        fines={fines}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={fetchFines}
        onAddFine={handleAddFine}
        onUpdateFine={handleUpdateFine}
        onExport={() => exportToExcel(fines, "fines")}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}


