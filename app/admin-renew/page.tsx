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
} from "lucide-react";

const tiles = [
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "admin/detect-assignments", label: "Detect", icon: Search },
  { id: "registration", label: "Registration", icon: UserPlus },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "holidays", label: "Holidays", icon: CalendarDays },
  { id: "history", label: "Seminar History", icon: Users },
  { id: "fines", label: "Fines", icon: DollarSign },
  { id: "fine-students", label: "Fine Students", icon: DollarSign },
  { id: "database", label: "Database", icon: Database },
  
];

export default function AdminRenewLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel (Renew)</h1>
          <p className="text-gray-600">Tap a card to open the dedicated tool</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tiles.map((tile) => (
            <Link key={tile.id} href={`/admin-renew/${tile.id}`}>
              <Card className="group h-full cursor-pointer border-gray-200 hover:border-blue-600 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      {tile.icon && <tile.icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tile.label}</div>
                      <div className="text-xs text-gray-500">Open {tile.label}</div>
                    </div>
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


