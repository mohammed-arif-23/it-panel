"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  Eye,
  Users,
  Clock,
  Hash
} from "lucide-react";
import ModernAdminNavbar from "@/components/admin/ModernAdminNavbar";
import PlagiarismDetection from "@/components/adminComponents/PlagiarismDetection";

interface AssignmentSubmission {
  id: string;
  student_id: string;
  assignment_id: string;
  file_url: string;
  file_name: string;
  submitted_at: string;
  status: string;
  student_name: string;
  register_number: string;
  assignment_title: string;
  file_hash?: string;
  file_size?: number;
  similarity_score?: number;
  matched_submissions?: string[];
}

interface DetectionResult {
  method: string;
  description: string;
  suspicious_groups: Array<{
    group_id: string;
    submissions: AssignmentSubmission[];
    confidence: number;
    reason: string;
  }>;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  class_year: string;
  due_date: string;
  created_at: string;
}

export default function DetectAssignmentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("detect-assignments");
  
  // Detection states
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  
  // Filters
  const [filters, setFilters] = useState({
    assignment: "",
    class_year: "",
    date_range: "",
    min_similarity: 80
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
      fetchSubmissions();
    }
  }, [isAuthenticated, filters]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/admin/auth");
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/admin/assignments");
      const data = await response.json();
      
      if (data.data) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.assignment) params.append('assignment', filters.assignment);
      if (filters.class_year) params.append('class_year', filters.class_year);
      if (filters.date_range) params.append('date_range', filters.date_range);
      
      const response = await fetch(`/api/admin/detect-assignments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    }
  };

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      // Pre-check hash generation stats to decide the best detection method.
      // If all submissions have stored hashes (without_hash === 0), prefer hash-based detection
      // to avoid direct file checks.
      let effectiveMethod = selectedMethod;
      try {
        const statsUrl = selectedAssignment
          ? `/api/admin/generate-hashes?assignment_id=${selectedAssignment}`
          : "/api/admin/generate-hashes";
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();
        if (statsData?.success && statsData?.statistics?.without_hash === 0) {
          // All submissions have hashes; force hash-only to avoid direct file checks
          effectiveMethod = "hash";
        }
      } catch (e) {
        console.warn("Could not fetch hash stats before detection, proceeding with selected method.", e);
      }

      console.log("Running detection with:", {
        assignment_id: selectedAssignment,
        method: effectiveMethod,
        min_similarity: filters.min_similarity
      });

      const response = await fetch("/api/admin/detect-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: selectedAssignment,
          method: effectiveMethod,
          min_similarity: filters.min_similarity
        }),
      });

      const data = await response.json();
      console.log("Detection response:", data);
      
      if (data.success) {
        setDetectionResults(data.results || []);
        if (!data.results || data.results.length === 0) {
          alert("No suspicious patterns detected. This could mean:\n1. No submissions found for the selected criteria\n2. All submissions are unique\n3. Similarity threshold is too high");
        }
      } else {
        alert("Detection failed: " + data.error);
      }
    } catch (error) {
      console.error("Detection error:", error);
      alert("Detection failed. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch("/api/admin/test-db");
      const data = await response.json();
      
      if (data.success) {
        console.log("Database test results:", data.data);
        alert(`Database Test Results:
        
Assignments: ${data.data.assignments.count} (${data.data.assignments.error || 'OK'})
Submissions: ${data.data.submissions.count} (${data.data.submissions.error || 'OK'})
Students: ${data.data.students.count} (${data.data.students.error || 'OK'})
Joined Query: ${data.data.joined.count} (${data.data.joined.error || 'OK'})

Check console for detailed results.`);
      } else {
        alert("Database test failed: " + data.error);
      }
    } catch (error) {
      alert("Database test failed: " + error);
    }
  };

  const testDetectionWithoutFilter = async () => {
    setIsDetecting(true);
    try {
      console.log("Testing detection without assignment filter...");
      
      const response = await fetch("/api/admin/detect-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: "", // No assignment filter
          method: "all",
          min_similarity: 80
        }),
      });

      const data = await response.json();
      console.log("Detection without filter response:", data);
      
      if (data.success) {
        alert(`Detection Test Results:
        
Total Submissions: ${data.total_submissions || 0}
Total Groups: ${data.total_groups || 0}
Results: ${data.results?.length || 0}

Check console for detailed logs.`);
      } else {
        alert("Detection test failed: " + data.error);
      }
    } catch (error) {
      console.error("Detection test error:", error);
      alert("Detection test failed: " + error);
    } finally {
      setIsDetecting(false);
    }
  };

  const exportResults = () => {
    const exportData = detectionResults.flatMap(result => 
      result.suspicious_groups.map(group => ({
        method: result.method,
        group_id: group.group_id,
        confidence: group.confidence,
        reason: group.reason,
        student_count: group.submissions.length,
        students: group.submissions.map(s => s.student_name).join(", "),
        register_numbers: group.submissions.map(s => s.register_number).join(", "),
        assignment: group.submissions[0]?.assignment_title || "",
        submitted_at: group.submissions[0]?.submitted_at || ""
      }))
    );

    const csvContent = [
      ["Method", "Group ID", "Confidence", "Reason", "Student Count", "Students", "Register Numbers", "Assignment", "Submitted At"],
      ...exportData.map(row => [
        row.method,
        row.group_id,
        row.confidence,
        row.reason,
        row.student_count,
        row.students,
        row.register_numbers,
        row.assignment,
        row.submitted_at
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assignment_detection_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-16 bg-gray-50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assignment Plagiarism Detection
          </h1>
          <p className="text-gray-600">
            Detect multiple students uploading the same or similar assignments using advanced algorithms.
          </p>
        </div>

        {/* Hash Generation & Setup */}
        <div className="mb-8">
          <PlagiarismDetection />
        </div>

        {/* Detection Methods Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Detection Methods
            </CardTitle>
            <CardDescription>
              Two powerful methods to identify suspicious assignment submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold">File Hash Comparison</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Identifies identical files by comparing cryptographic hashes
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h3 className="font-semibold">Metadata Analysis</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Examines file metadata for suspicious patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detection Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Run Detection</CardTitle>
            <CardDescription>
              Configure and run plagiarism detection on assignment submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <Label htmlFor="assignment">Assignment</Label>
                <select
                  id="assignment"
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Assignments</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title} ({assignment.class_year})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="method">Detection Method</Label>
                <select
                  id="method"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Methods</option>
                  <option value="hash">File Hash</option>
                  <option value="metadata">Metadata Analysis</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="class_year">Class Year</Label>
                <select
                  id="class_year"
                  value={filters.class_year}
                  onChange={(e) => setFilters(prev => ({ ...prev, class_year: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Classes</option>
                  <option value="I-IT">I-IT (1st Year)</option>
                  <option value="II-IT">II-IT (2nd Year)</option>
                  <option value="III-IT">III-IT (3rd Year)</option>
                  <option value="IV-IT">IV-IT (4th Year)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="min_similarity">Min Similarity (%)</Label>
                <Input
                  id="min_similarity"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.min_similarity}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_similarity: parseInt(e.target.value) || 80 }))}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={runDetection} 
                  disabled={isDetecting}
                  className="w-full"
                >
                  {isDetecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isDetecting ? "Detecting..." : "Run Detection"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Results */}
        {detectionResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detection Results</CardTitle>
                  <CardDescription>
                    Found {detectionResults.reduce((acc, result) => acc + result.suspicious_groups.length, 0)} suspicious groups
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={testDatabase} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Test DB
                  </Button>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {detectionResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-lg">{result.method}</h3>
                      <Badge variant="secondary">{result.suspicious_groups.length} groups</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{result.description}</p>

                    <div className="space-y-4">
                      {result.suspicious_groups.map((group, groupIndex) => (
                        <div key={groupIndex} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">Group {group.group_id}</h4>
                              {group.submissions?.[0]?.assignment_title && (
                                <p className="text-xs text-gray-700 mt-0.5">
                                  Subject: {group.submissions[0].assignment_title}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">{group.reason}</p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={group.confidence > 90 ? "destructive" : group.confidence > 70 ? "default" : "secondary"}
                              >
                                {group.confidence}% confidence
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.submissions.map((submission, subIndex) => (
                              <div key={subIndex} className="bg-white rounded-lg p-3 border">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-sm">{submission.student_name}</p>
                                    <p className="text-xs text-gray-500">{submission.register_number}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {submission.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{submission.file_name}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(submission.submitted_at).toLocaleString()}
                                </p>
                                {submission.similarity_score && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Similarity: {submission.similarity_score}%
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {detectionResults.length === 0 && !isDetecting && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Detection Results</h3>
              <p className="text-gray-600 mb-4">
                Run detection to identify suspicious assignment submissions.
              </p>
              {submissions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 mb-4">
                    <strong>No submissions found.</strong> Make sure there are assignment submissions in the database for the selected criteria.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={testDatabase} variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Test DB
                    </Button>
                    <Button onClick={testDetectionWithoutFilter} variant="outline" size="sm" disabled={isDetecting}>
                      <Search className="h-4 w-4 mr-2" />
                      Test Detection
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 mb-4">
                    <strong>{submissions.length} submissions available.</strong> Try running detection with different parameters or lower similarity threshold.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={testDatabase} variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Test DB
                    </Button>
                    <Button onClick={testDetectionWithoutFilter} variant="outline" size="sm" disabled={isDetecting}>
                      <Search className="h-4 w-4 mr-2" />
                      Test Detection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
