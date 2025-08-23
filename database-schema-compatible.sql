-- Unified College Application Database Schema (Compatible with Existing Structure)
-- This schema adds unified authentication tables while preserving existing seminar and NPTEL tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- NEW UNIFIED AUTHENTICATION TABLES
-- ===========================

-- Unified students table for authentication (different from existing 'students' table)
-- This will serve as the main authentication hub
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_students') THEN
        CREATE TABLE public.unified_students (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            register_number TEXT UNIQUE NOT NULL,
            name TEXT,
            email TEXT,
            mobile TEXT,
            class_year TEXT, -- II-IT, III-IT, etc.
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
    END IF;
END $$;

-- Student registration data for services
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_student_registrations') THEN
        CREATE TABLE public.unified_student_registrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.unified_students(id) ON DELETE CASCADE,
            registration_type TEXT NOT NULL CHECK (registration_type IN ('nptel', 'seminar', 'both')),
            registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            is_active BOOLEAN DEFAULT true,
            CONSTRAINT unique_unified_student_registration UNIQUE(student_id, registration_type)
        );
    END IF;
END $$;

-- ===========================
-- NEW NPTEL UNIFIED TABLES
-- ===========================

-- NPTEL course enrollments (unified approach)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_nptel_enrollments') THEN
        CREATE TABLE public.unified_nptel_enrollments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.unified_students(id) ON DELETE CASCADE,
            course_name TEXT NOT NULL,
            course_id TEXT NOT NULL,
            course_duration INTEGER NOT NULL DEFAULT 12,
            enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            is_active BOOLEAN DEFAULT true
        );
    END IF;
END $$;

-- NPTEL weekly progress tracking (unified approach)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_nptel_progress') THEN
        CREATE TABLE public.unified_nptel_progress (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            enrollment_id UUID NOT NULL REFERENCES public.unified_nptel_enrollments(id) ON DELETE CASCADE,
            week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
            status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            CONSTRAINT unique_unified_enrollment_week UNIQUE(enrollment_id, week_number)
        );
    END IF;
END $$;

-- ===========================
-- NEW SEMINAR UNIFIED TABLES
-- ===========================

-- Unified seminar bookings (to work alongside existing bookings table)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_seminar_bookings') THEN
        CREATE TABLE public.unified_seminar_bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.unified_students(id) ON DELETE CASCADE,
            booking_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            CONSTRAINT unique_unified_student_seminar_booking UNIQUE(student_id, booking_date)
        );
    END IF;
END $$;

-- Unified seminar selections (to work alongside existing selections table)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_seminar_selections') THEN
        CREATE TABLE public.unified_seminar_selections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL REFERENCES public.unified_students(id) ON DELETE CASCADE,
            seminar_date DATE NOT NULL,
            selected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            CONSTRAINT unique_unified_seminar_date UNIQUE(seminar_date)
        );
    END IF;
END $$;

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Create indexes only if they don't exist

-- Unified student indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_students_register_number') THEN
        CREATE INDEX idx_unified_students_register_number ON public.unified_students(register_number);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_students_class_year') THEN
        CREATE INDEX idx_unified_students_class_year ON public.unified_students(class_year);
    END IF;
END $$;

-- Registration indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_registrations_student_id') THEN
        CREATE INDEX idx_unified_registrations_student_id ON public.unified_student_registrations(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_registrations_type') THEN
        CREATE INDEX idx_unified_registrations_type ON public.unified_student_registrations(registration_type);
    END IF;
END $$;

-- NPTEL indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_nptel_enrollments_student_id') THEN
        CREATE INDEX idx_unified_nptel_enrollments_student_id ON public.unified_nptel_enrollments(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_nptel_progress_enrollment_id') THEN
        CREATE INDEX idx_unified_nptel_progress_enrollment_id ON public.unified_nptel_progress(enrollment_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_nptel_progress_week') THEN
        CREATE INDEX idx_unified_nptel_progress_week ON public.unified_nptel_progress(week_number);
    END IF;
END $$;

-- Seminar indexes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_seminar_bookings_student_id') THEN
        CREATE INDEX idx_unified_seminar_bookings_student_id ON public.unified_seminar_bookings(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_seminar_bookings_date') THEN
        CREATE INDEX idx_unified_seminar_bookings_date ON public.unified_seminar_bookings(booking_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_seminar_selections_student_id') THEN
        CREATE INDEX idx_unified_seminar_selections_student_id ON public.unified_seminar_selections(student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unified_seminar_selections_date') THEN
        CREATE INDEX idx_unified_seminar_selections_date ON public.unified_seminar_selections(seminar_date);
    END IF;
END $$;

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

-- Enable RLS on new tables
ALTER TABLE public.unified_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_nptel_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_nptel_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_seminar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_seminar_selections ENABLE ROW LEVEL SECURITY;

-- Policies for unified students table
DROP POLICY IF EXISTS "Unified students can view all students" ON public.unified_students;
CREATE POLICY "Unified students can view all students" 
    ON public.unified_students FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Unified students can insert themselves" ON public.unified_students;
CREATE POLICY "Unified students can insert themselves" 
    ON public.unified_students FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Unified students can update themselves" ON public.unified_students;
CREATE POLICY "Unified students can update themselves" 
    ON public.unified_students FOR UPDATE 
    USING (true);

-- Policies for registrations
DROP POLICY IF EXISTS "Unified students can manage registrations" ON public.unified_student_registrations;
CREATE POLICY "Unified students can manage registrations" 
    ON public.unified_student_registrations FOR ALL 
    USING (true);

-- Policies for NPTEL tables
DROP POLICY IF EXISTS "Unified students can manage NPTEL enrollments" ON public.unified_nptel_enrollments;
CREATE POLICY "Unified students can manage NPTEL enrollments" 
    ON public.unified_nptel_enrollments FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Unified students can manage NPTEL progress" ON public.unified_nptel_progress;
CREATE POLICY "Unified students can manage NPTEL progress" 
    ON public.unified_nptel_progress FOR ALL 
    USING (true);

-- Policies for seminar tables
DROP POLICY IF EXISTS "Unified students can manage seminar bookings" ON public.unified_seminar_bookings;
CREATE POLICY "Unified students can manage seminar bookings" 
    ON public.unified_seminar_bookings FOR ALL 
    USING (true);

DROP POLICY IF EXISTS "Unified students can view seminar selections" ON public.unified_seminar_selections;
CREATE POLICY "Unified students can view seminar selections" 
    ON public.unified_seminar_selections FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Unified service can manage seminar selections" ON public.unified_seminar_selections;
CREATE POLICY "Unified service can manage seminar selections" 
    ON public.unified_seminar_selections FOR INSERT 
    WITH CHECK (true);

-- ===========================
-- GRANT PERMISSIONS
-- ===========================

-- Grant permissions to authenticated users and anon users
GRANT ALL ON public.unified_students TO authenticated, anon;
GRANT ALL ON public.unified_student_registrations TO authenticated, anon;
GRANT ALL ON public.unified_nptel_enrollments TO authenticated, anon;
GRANT ALL ON public.unified_nptel_progress TO authenticated, anon;
GRANT ALL ON public.unified_seminar_bookings TO authenticated, anon;
GRANT ALL ON public.unified_seminar_selections TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ===========================
-- DATA MIGRATION HELPER VIEWS
-- ===========================

-- Create a view to help migrate data from existing tables if needed
CREATE OR REPLACE VIEW existing_student_data AS
SELECT 
    'ii_it' as source_table,
    register_number,
    register_number as name,  -- Use register_number as fallback for name
    mobile,
    'II-IT' as class_year
FROM ii_it_students
WHERE register_number IS NOT NULL
UNION ALL
SELECT 
    'iii_it' as source_table,
    register_number,
    register_number as name,  -- Use register_number as fallback for name
    mobile,
    'III-IT' as class_year
FROM iii_it_students
WHERE register_number IS NOT NULL;

-- ===========================
-- SAMPLE DATA
-- ===========================

-- Insert sample unified students (avoiding conflicts)
INSERT INTO public.unified_students (register_number, name, email, mobile, class_year) 
SELECT 
    register_number,
    name,  -- This will be register_number from the view
    CASE 
        WHEN name IS NOT NULL THEN CONCAT(LOWER(REPLACE(name, ' ', '.')), '@college.edu')
        ELSE CONCAT(LOWER(register_number), '@college.edu')
    END as email,
    COALESCE(mobile, '') as mobile,
    class_year
FROM existing_student_data
WHERE register_number IS NOT NULL
ON CONFLICT (register_number) DO NOTHING;

-- Insert sample registrations for existing students
INSERT INTO public.unified_student_registrations (student_id, registration_type)
SELECT 
    us.id,
    'both' as registration_type
FROM public.unified_students us
ON CONFLICT (student_id, registration_type) DO NOTHING;

-- Verification query
SELECT 'Unified database schema applied successfully' as status,
       COUNT(*) as unified_students_count
FROM public.unified_students;