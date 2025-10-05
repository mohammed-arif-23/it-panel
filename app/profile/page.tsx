"use client";

import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { PullToRefresh } from "../../components/pwa/PullToRefresh";
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
import PageTransition from "../../components/ui/PageTransition";
import { SkeletonCard } from "../../components/ui/skeletons";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../../lib/animations";
import RedirectLoader from "../../components/ui/RedirectLoader";
import StudentOverview from "../../components/profile/StudentOverview";

export default function ProfilePage() {

  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleRefresh = async () => {
    // Refresh will reload user data from context
    window.location.reload()
  }

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
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-24 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} variant="wide" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <RedirectLoader context="profile" />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between px-4 py-2">
            <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-[var(--color-primary)]">Profile</h1>
            </div>
            <img src="/icons/android/android-launchericon-512-512.png" 
              className='w-12 h-12 p-0'
              alt="Logo"/>
          </div>
        </div>


        {/* Student Overview Section */}
        <div className="mt-6 mb-6">
          <StudentOverview 
            studentId={user.id} 
            classYear={user.class_year || ''} 
          />
        </div>

        <Card className="saas-card mb-4 p-4">
          <CardHeader className="border-b border-[var(--color-border-light)]">
            <CardTitle className="flex items-center space-x-3 text-[var(--color-primary)]">
              <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                <User className="h-5 w-5 text-[var(--color-secondary)]" />
              </div>
              <span>Profile Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Registration Number */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center space-x-3">
                  <IdCard className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)] text-sm">Register Number</span>
                </div>
                <span className="font-medium text-[var(--color-primary)] text-sm">
                  {user.register_number || "Not provided"}
                </span>
              </div>

              {/* Name */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)] text-sm">Full Name</span>
                </div>
                <span className="font-medium text-[var(--color-primary)] text-sm">
                  {user.name || "Not provided"}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)] text-sm">Email Address</span>
                </div>
                <span className="font-medium text-[var(--color-primary)] text-sm">
                  {user.email || "Not provided"}
                </span>
              </div>

              {/* Mobile */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)] text-sm">Mobile Number</span>
                </div>
                <span className="font-medium text-[var(--color-primary)] text-sm">
                  {user.mobile || "Not provided"}
                </span>
              </div>

              {/* Class Year */}
              <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-secondary)] text-sm">Class Year</span>
                </div>
                <span className="font-medium text-[var(--color-primary)] text-sm">
                  {user.class_year || "Not provided"}
                </span>
              </div>

              {/* Logout Button */}
              <div className="pt-4">
                <Button 
                  className="saas-button-primary w-full bg-red-600 hover:bg-red-700 text-white ripple"
                  onClick={async () => { await logout(); router.push('/'); }}
                >
                  Logout
                </Button>
              </div>
            </div>
             
          </CardContent>
          
        </Card>
      </div>
      </PageTransition>
    </PullToRefresh>
  );
}