"use client";

import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ArrowLeft,
  User,
  CheckCircle,
  AlertCircle,
  IdCard,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Loader from "../../components/ui/loader";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Helper function to check if a field has meaningful data
  const hasData = (value: string | null | undefined): boolean => {
    return !!(value && typeof value === "string" && value.trim().length > 0);
  };

  // Check if this is a new student (profile incomplete)
  const isNewStudent =
    user &&
    (!hasData(user.name) || !hasData(user.email) || !hasData(user.class_year));

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="w-16 h-16">
          <Loader />
        </div>
      </div>
    );
  }

  if (!user) {
    return <div>Redirecting...</div>;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{ zIndex: -10, pointerEvents: "none" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        ></div>
      </div>

      {/* Header with Back Button */}
      <div className="backdrop-blur-md bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button
              variant="ghost"
              asChild
              className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 hover:shadow-xl rounded-xl px-6 py-3 hover:border-blue-300"
            >
              <Link href="/">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex flex-col items-end">
              <p className="text-xl font-bold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 font-medium">
                {user.register_number || "Student"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Personal Information
          </h1>
          <p className="text-gray-600 text-sm">
            Your profile details
          </p>
        </div>

        {isNewStudent ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="text-blue-800 font-semibold">
                Profile Incomplete
              </p>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              Please contact administration to complete your profile
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800 font-semibold">
                Profile Complete
              </p>
            </div>
          </div>
        )}

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <CardTitle className="flex items-center space-x-3 text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span>Profile Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Registration Number */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <IdCard className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Register Number</span>
                </div>
                <span className="font-medium text-gray-900">
                  {user.register_number || "Not provided"}
                </span>
              </div>

              {/* Name */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Full Name</span>
                </div>
                <span className="font-medium text-gray-900">
                  {user.name || "Not provided"}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Email Address</span>
                </div>
                <span className="font-medium text-gray-900">
                  {user.email || "Not provided"}
                </span>
              </div>

              {/* Mobile */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Mobile Number</span>
                </div>
                <span className="font-medium text-gray-900">
                  {user.mobile || "Not provided"}
                </span>
              </div>

              {/* Class Year */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Class Year</span>
                </div>
                <span className="font-medium text-gray-900">
                  {user.class_year || "Not provided"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}