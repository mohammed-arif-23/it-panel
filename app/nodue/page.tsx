"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { dbHelpers } from "@/lib/supabase";
import {
  canGenerateCertificate,
  getAssignmentStatusLabel,
  getFeeStatusLabel,
  toRomanNumeral,
  normalizeCode,
  isMarksCleared,
  isAssignmentsCleared,
} from "@/lib/noDueHelpers";
import { SkeletonCard } from "@/components/ui/skeletons";
import PageTransition from "@/components/ui/PageTransition";
import { PDFDownloadButton } from "@/components/nodue/PDFDownloadButton";

interface Student {
  id: string;
  register_number: string;
  name: string;
  class_year: string;
  semester: number;
  year: number;
  total_fine_amount: number;
}

interface MarksRecord {
  subject: string;
  iat: number | null;
  model: number | null;
  assignmentsubmitted: boolean;
  signed: boolean;
  department_fine: number;
}

interface Subject {
  code: string;
  name: string;
  department: string;
  semester: number;
  course_type: string;
}

interface AssignmentData {
  [subCode: string]: {
    total: number;
    submitted: number;
  };
}

export default function NoDuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<MarksRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignmentData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchNoDueData();
    }
  }, [user]);

  const fetchNoDueData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const {
        student: studentData,
        marks: marksData,
        subjects: subjectsData,
        assignments: assignmentsData,
      } = await dbHelpers.getNoDueData(user.id);

      if (studentData.error) {
        throw new Error(
          studentData.error.message || "Failed to fetch student data"
        );
      }
      if (marksData.error) {
        throw new Error(
          marksData.error.message || "Failed to fetch marks data"
        );
      }
      if (subjectsData.error) {
        throw new Error(
          subjectsData.error.message || "Failed to fetch subjects data"
        );
      }

      setStudent(studentData.data as Student | null);
      setMarks((marksData.data as MarksRecord[]) || []);
      setSubjects((subjectsData.data as Subject[]) || []);
      setAssignmentData(assignmentsData.data || {});
    } catch (err: any) {
      console.error("Error fetching No Due data:", err);
      setError(err.message || "Failed to load No Due certificate data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Skeleton Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="w-16 h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-40 h-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full skeleton animate-pulse" />
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Skeleton Table */}
          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto">
              {/* Table Header Skeleton */}
              <div className="bg-[var(--color-accent)] p-4 flex justify-between">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-20 h-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
                ))}
              </div>
              {/* Table Rows Skeleton */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex justify-between border-t border-[var(--color-border-light)]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="w-20 h-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Skeleton Button */}
          <div className="saas-card p-6">
            <div className="w-full h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between px-4 py-2">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-bold text-[var(--color-primary)]">
              No Due Certificate
            </h1>
            <img
              src="/icons/android/android-launchericon-512-512.png"
              className="w-12 h-12 p-0"
              alt="Logo"
            />
          </div>
        </div>
        <div className="p-4">
          <div className="saas-card p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
              Error Loading Data
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
            <button onClick={fetchNoDueData} className="saas-button-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  // Check if student can generate certificate (same as no-due-generator app)
  const canGenerate = canGenerateCertificate(
    marks,
    subjects,
    assignmentData,
    student.total_fine_amount
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between px-4 py-2">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-bold text-[var(--color-primary)]">
              No Due Certificate
            </h1>
            <img
              src="/icons/android/android-launchericon-512-512.png"
              className="w-12 h-12 p-0"
              alt="Logo"
            />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Certificate Header */}

          {/* Marks Table */}
          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-accent)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--color-primary)]">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)]">
                      IAT
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)]">
                      Model
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)]">
                      Assignment
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)]">
                      Dept. Fine
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)]">
                      Signature
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {subjects.map((subject) => {
                    const mark = marks.find(
                      (m) =>
                        normalizeCode(m.subject) === normalizeCode(subject.name)
                    );
                    const assignmentStatus = getAssignmentStatusLabel(
                      subject.code,
                      assignmentData
                    );
                    const feeStatus = getFeeStatusLabel(
                      student.total_fine_amount
                    );
                    const marksCleared = mark
                      ? isMarksCleared(mark.iat, mark.model)
                      : false;
                    const assignmentsCleared = isAssignmentsCleared(
                      subject.code,
                      assignmentData
                    );
                    const feesCleared = student.total_fine_amount === 0;
                    const allCleared =
                      marksCleared && assignmentsCleared && feesCleared;

                    return (
                      <tr
                        key={subject.code}
                        className="hover:bg-[var(--color-accent)] transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                          {subject.name}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">
                          {mark?.iat ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">
                          {mark?.model ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              assignmentStatus === "Submitted"
                                ? "bg-green-100 text-green-800"
                                : assignmentStatus === "Not Submitted"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {assignmentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              feeStatus === "Paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {feeStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {allCleared ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Office Row */}
                  <tr className="hover:bg-[var(--color-accent)] transition-colors bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
                      Office
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getFeeStatusLabel(student.total_fine_amount) ===
                          "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getFeeStatusLabel(student.total_fine_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.total_fine_amount === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>

                  {/* Library Row */}
                  <tr className="hover:bg-[var(--color-accent)] transition-colors bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
                      Library
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">
                      -
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getFeeStatusLabel(student.total_fine_amount) ===
                          "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getFeeStatusLabel(student.total_fine_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.total_fine_amount === 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Generate Button */}
          <div className="saas-card p-6">
            {!canGenerate && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Complete all pending requirements to generate your
                    certificate
                  </p>
                  <ul className="mt-2 text-xs text-yellow-700 list-disc list-inside space-y-1">
                    {subjects.some((s) => {
                      const mark = marks.find(
                        (m) =>
                          normalizeCode(m.subject) === normalizeCode(s.name)
                      );
                      return !mark || !isMarksCleared(mark.iat, mark.model);
                    }) && (
                      <li>Ensure all subjects have IAT and Model marks ≥ 50</li>
                    )}
                    {subjects.some(
                      (s) => !isAssignmentsCleared(s.code, assignmentData)
                    ) && <li>Submit all pending assignments</li>}
                    {student.total_fine_amount > 0 && (
                      <li>
                        Clear all department fees (₹{student.total_fine_amount}{" "}
                        pending)
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <PDFDownloadButton
              studentId={student.id}
              studentName={student.name}
              registerNumber={student.register_number}
              canDownload={canGenerate}
              onDownloadComplete={() => {
                alert("Certificate downloaded successfully!");
              }}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
