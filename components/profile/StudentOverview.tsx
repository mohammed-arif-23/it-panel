'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  AlertTriangle,
  DollarSign,
  GraduationCap,
  TrendingUp,
  Award,
  Calendar,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OverviewData {
  assignments: {
    total: number;
    submitted: number;
    pending: number;
    completionPercentage: number;
  };
  seminar: {
    hasTaken: boolean;
    count: number;
    lastPresentation: any;
  };
  fines: {
    total: number;
    count: number;
    unpaidCount: number;
    recentFines: any[];
  };
  marks: {
    iat1: number | null;
    iat2: number | null;
    model: number | null;
    subjects: any[];
    totalSubjects: number;
    signedSubjects: number;
    assignmentsSubmitted: number;
  };
  overallStatus: {
    assignmentsGood: boolean;
    seminarGood: boolean;
    finesGood: boolean;
    marksAvailable: boolean;
  };
}

interface StudentOverviewProps {
  studentId: string;
  classYear: string;
}

export default function StudentOverview({ studentId, classYear }: StudentOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewData();
  }, [studentId, classYear]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/overview?student_id=${studentId}&class_year=${classYear}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Top summary skeletons */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card
              key={`sum-${i}`}
              className="rounded-xl border border-transparent shadow-sm animate-pulse min-h-[160px] bg-gradient-to-br from-purple-50 via-white to-purple-100"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-100 via-purple-50 to-purple-200 skeleton" />
                    <div className="h-4 w-24 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                  </div>
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-100 via-purple-50 to-purple-200 skeleton" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <div className="h-3 w-20 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                    <div className="h-3 w-12 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                  </div>
                  <div className="h-2 w-full rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Academic Performance skeleton */}
        <Card className="rounded-xl border border-transparent shadow-sm animate-pulse bg-gradient-to-br from-purple-50 via-white to-purple-100">
          <CardHeader className="pb-3">
            <div className="h-5 w-40 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`metric-${i}`}
                  className="p-4 rounded-lg bg-gradient-to-br from-purple-100 via-white to-purple-200"
                >
                  <div className="h-3 w-10 mb-2 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                  <div className="h-6 w-12 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fines skeleton */}
        <Card className="rounded-xl border border-transparent shadow-sm animate-pulse bg-gradient-to-br from-purple-50 via-white to-purple-100">
          <CardHeader className="pb-3">
            <div className="h-5 w-40 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`fine-${i}`} className="flex justify-between items-center py-2">
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                    <div className="h-3 w-24 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                  </div>
                  <div className="h-6 w-14 rounded bg-gradient-to-r from-purple-100 via-purple-50 to-purple-200 skeleton" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error || 'Failed to load overview'}</p>
        </CardContent>
      </Card>
    );
  }

  const assignmentCardClasses = data.overallStatus.assignmentsGood
    ? 'border-transparent bg-gradient-to-br from-emerald-50 via-white to-emerald-100'
    : 'bg-red-50 border-red-200';

  const seminarCardClasses = data.overallStatus.seminarGood
    ? 'border-transparent bg-gradient-to-br from-emerald-50 via-white to-emerald-100'
    : 'bg-orange-50 border-orange-200';

  return (
    <div className="space-y-6">
      {/* Overall Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Assignment Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`rounded-xl border shadow-sm h-full min-h-[160px] ${assignmentCardClasses}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${data.overallStatus.assignmentsGood ? 'bg-emerald-100/80' : 'bg-red-100'}`}>
                    <FileText className={`h-4 w-4 ${data.overallStatus.assignmentsGood ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Assignments</span>
                </div>
                {data.overallStatus.assignmentsGood ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Clock className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{data.assignments.submitted}/{data.assignments.total}</span>
                </div>
                <Progress 
                  value={data.assignments.completionPercentage} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {data.assignments.completionPercentage}% Complete
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seminar Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`rounded-xl border shadow-sm h-full min-h-[160px] ${seminarCardClasses}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${data.overallStatus.seminarGood ? 'bg-emerald-100/80' : 'bg-orange-100'}`}>
                    <GraduationCap className={`h-4 w-4 ${data.overallStatus.seminarGood ? 'text-emerald-600' : 'text-orange-600'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Seminar</span>
                </div>
                {data.overallStatus.seminarGood ? (
                  <Trophy className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Calendar className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">
                  {data.seminar.hasTaken ? 'Completed' : 'Pending'}
                </p>
                <p className="text-xs text-gray-500">
                  {data.seminar.count > 0 
                    ? `${data.seminar.count} presentation${data.seminar.count > 1 ? 's' : ''}`
                    : 'No presentations yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Cards */}
      <div className="space-y-4">
        {/* Academic Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-xl border border-[var(--color-border-light)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Academic Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {data.overallStatus.marksAvailable ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">IAT 1</p>
                      <p className="text-xl font-bold text-blue-600">
                        {data.marks.iat1 ?? '--'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">IAT 2</p>
                      <p className="text-xl font-bold text-purple-600">
                        {data.marks.iat2 ?? '--'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Model</p>
                      <p className="text-xl font-bold text-green-600">
                        {data.marks.model ?? '--'}
                      </p>
                    </div>
                  </div>
                  {data.marks.totalSubjects > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 text-sm">
                        <div className="text-center">
                          <p className="text-gray-600">Subjects</p>
                          <p className="font-semibold">{data.marks.totalSubjects}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Marks not available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fines & Penalties */}
        {(data.fines.total > 0 || data.fines.count > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`rounded-xl border ${data.overallStatus.finesGood ? 'border-green-200' : 'border-red-200'} shadow-sm`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className={`h-5 w-5 ${data.overallStatus.finesGood ? 'text-green-600' : 'text-red-600'}`} />
                    <span>Fines & Penalties</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {data.fines.unpaidCount > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Unpaid Fines</span>
                      <span className="font-semibold text-red-600">{data.fines.unpaidCount}</span>
                    </div>
                    {data.fines.recentFines.slice(0, 2).map((fine, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{fine.reason}</p>
                          <p className="text-xs text-gray-500">{new Date(fine.fine_date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={fine.is_paid ? "default" : "destructive"}>
                          ₹{fine.amount}
                        </Badge>
                      </div>
                    ))}
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-600">Total outstanding</span>
                      <span className="font-semibold text-red-600">₹{data.fines.total}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    {data.fines.total > 0 ? (
                      <p className="text-sm text-gray-700">No pending fines. Total paid so far: <span className="font-semibold">₹{data.fines.total}</span></p>
                    ) : (
                      <p className="text-sm font-medium text-green-600">No pending fines</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
