-- Unified College Application Database Schema
-- This schema combines NPTEL course tracking and seminar booking systems

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- CORE AUTHENTICATION TABLES
-- ===========================

-- Main students table for authentication and basic info
DROP TABLE IF EXISTS public.students CASCADE;
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_number TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    mobile TEXT,
    class_year TEXT, -- II-IT, III-IT, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Student registration data
DROP TABLE IF EXISTS public.student_registrations CASCADE;
CREATE TABLE public.student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    registration_type TEXT NOT NULL CHECK (registration_type IN ('nptel', 'seminar', 'both')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT unique_student_registration UNIQUE(student_id, registration_type)
);

-- ===========================
-- NPTEL COURSE TRACKING TABLES
-- ===========================

-- NPTEL course enrollments
DROP TABLE IF EXISTS public.nptel_enrollments CASCADE;
CREATE TABLE public.nptel_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_duration INTEGER NOT NULL DEFAULT 12,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    is_active BOOLEAN DEFAULT true
);

-- NPTEL weekly progress tracking
DROP TABLE IF EXISTS public.nptel_progress CASCADE;
CREATE TABLE public.nptel_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.nptel_enrollments(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_enrollment_week UNIQUE(enrollment_id, week_number)
);

-- ===========================
-- SEMINAR BOOKING TABLES
-- ===========================

-- Seminar bookings (same as original)
DROP TABLE IF EXISTS public.seminar_bookings CASCADE;
CREATE TABLE public.seminar_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    seminar_topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_student_seminar_booking UNIQUE(student_id, booking_date)
);

-- Seminar selections (same as original)
DROP TABLE IF EXISTS public.seminar_selections CASCADE;
CREATE TABLE public.seminar_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    seminar_date DATE NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_seminar_date UNIQUE(seminar_date)
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Core student indexes
CREATE INDEX IF NOT EXISTS idx_students_register_number ON public.students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_class_year ON public.students(class_year);

-- Registration indexes
CREATE INDEX IF NOT EXISTS idx_registrations_student_id ON public.student_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_type ON public.student_registrations(registration_type);

-- NPTEL indexes
CREATE INDEX IF NOT EXISTS idx_nptel_enrollments_student_id ON public.nptel_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_nptel_progress_enrollment_id ON public.nptel_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_nptel_progress_week ON public.nptel_progress(week_number);

-- Seminar indexes
CREATE INDEX IF NOT EXISTS idx_seminar_bookings_student_id ON public.seminar_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_seminar_bookings_date ON public.seminar_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_seminar_selections_student_id ON public.seminar_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_seminar_selections_date ON public.seminar_selections(seminar_date);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nptel_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nptel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seminar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seminar_selections ENABLE ROW LEVEL SECURITY;

-- Policies for students table
DROP POLICY IF EXISTS "Students can view all students" ON public.students;
CREATE POLICY "Students can view all students" 
    ON public.students FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Students can insert themselves" ON public.students;
CREATE POLICY "Students can insert themselves" 
    ON public.students FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Students can update themselves" ON public.students;
CREATE POLICY "Students can update themselves" 
    ON public.students FOR UPDATE 
    USING (true);

-- Policies for registrations
DROP POLICY IF EXISTS "Students can manage registrations" ON public.student_registrations;
CREATE POLICY "Students can manage registrations" 
    ON public.student_registrations FOR ALL 
    USING (true);

-- Policies for NPTEL tables
DROP POLICY IF EXISTS "Students can manage NPTEL enrollments" ON public.nptel_enrollments;
CREATE POLICY "Students can manage NPTEL enrollments" 
    ON public.nptel_enrollments FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Students can manage NPTEL progress" ON public.nptel_progress;
CREATE POLICY "Students can manage NPTEL progress" 
    ON public.nptel_progress FOR ALL 
    USING (true);

-- Policies for seminar tables
DROP POLICY IF EXISTS "Students can manage seminar bookings" ON public.seminar_bookings;
CREATE POLICY "Students can manage seminar bookings" 
    ON public.seminar_bookings FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Students can view seminar selections" ON public.seminar_selections;
CREATE POLICY "Students can view seminar selections" 
    ON public.seminar_selections FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Service can manage seminar selections" ON public.seminar_selections;
CREATE POLICY "Service can manage seminar selections" 
    ON public.seminar_selections FOR INSERT 
    WITH CHECK (true);

-- ===========================
-- GRANT PERMISSIONS
-- ===========================

-- Grant permissions to authenticated users and anon users
GRANT ALL ON public.students TO authenticated, anon;
GRANT ALL ON public.student_registrations TO authenticated, anon;
GRANT ALL ON public.nptel_enrollments TO authenticated, anon;
GRANT ALL ON public.nptel_progress TO authenticated, anon;
GRANT ALL ON public.seminar_bookings TO authenticated, anon;
GRANT ALL ON public.seminar_selections TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ===========================
-- SAMPLE DATA
-- ===========================

-- Insert sample students
INSERT INTO public.students (register_number, name, email, mobile, class_year) VALUES
    ('620123205027', 'John Doe', 'john@example.com', '9876543210', 'II-IT'),
    ('620123205028', 'Jane Smith', 'jane@example.com', '9876543211', 'II-IT'),
    ('620123205029', 'Bob Johnson', 'bob@example.com', '9876543212', 'III-IT')
ON CONFLICT (register_number) DO NOTHING;

-- Verify the setup
SELECT 'Database schema created successfully' as status;