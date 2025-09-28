"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Search,
  UserPlus,
  Calendar,
  CalendarDays,
  Users,
  DollarSign,
  Database,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";

const tiles = [
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "detect-assignments", label: "Detect", icon: Search },
  { id: "registration", label: "Registration", icon: UserPlus },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "holidays", label: "Holidays", icon: CalendarDays },
  { id: "history", label: "Seminar History", icon: Users },
  { id: "fines", label: "Fines", icon: DollarSign },
  { id: "fine-students", label: "Fine Students", icon: DollarSign },
  { id: "database", label: "Database", icon: Database },
  { id: "crud", label: "CRUD", icon: Database },
];

export default function AdminRenewLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Admin Panel</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">Tap a card to open the dedicated tool</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.id === "detect-assignments" ? `/admin/${tile.id}` : `/admin-renew/${tile.id}`}
              aria-label={`Open ${tile.label}`}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
            >
              <Card className="group h-full cursor-pointer rounded-2xl border border-gray-200 hover:border-blue-600 bg-white shadow-sm hover:shadow-lg transition-all duration-200">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-inset ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {tile.icon && <tile.icon className="h-5 w-5 md:h-6 md:w-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{tile.label}</div>
                      <div className="text-xs md:text-sm text-gray-500">Open {tile.label}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


