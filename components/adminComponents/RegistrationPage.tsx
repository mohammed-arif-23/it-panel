"use client";

import React from "react";
import ModernStudentRegistration from "@/components/admin/ModernStudentRegistration";

export default function RegistrationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ModernStudentRegistration onRefresh={() => {}} />
    </div>
  );
}


