-- Simple Database Analysis for Supabase
-- Run these queries one by one in Supabase SQL Editor

-- 1. Get all tables with basic info
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Get record counts for specific tables (run individually)
SELECT 'unified_students' as table_name, COUNT(*) as record_count FROM unified_students
UNION ALL
SELECT 'unified_student_registrations', COUNT(*) FROM unified_student_registrations
UNION ALL
SELECT 'unified_seminar_bookings', COUNT(*) FROM unified_seminar_bookings
UNION ALL
SELECT 'unified_seminar_selections', COUNT(*) FROM unified_seminar_selections
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'assignment_submissions', COUNT(*) FROM assignment_submissions
UNION ALL
SELECT 'unified_student_fines', COUNT(*) FROM unified_student_fines
ORDER BY record_count DESC;

-- 3. Check if unified_student_fines table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unified_student_fines'
) as fines_table_exists;

-- 4. Get unified_students structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'unified_students'
ORDER BY ordinal_position;

-- 5. Get assignments structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'assignments'
ORDER BY ordinal_position;

-- 6. Sample data from key tables
SELECT 'Students Sample:' as info;
SELECT id, register_number, name, class_year, created_at 
FROM unified_students 
LIMIT 3;

SELECT 'Assignments Sample:' as info;
SELECT id, title, class_year, due_date, created_at 
FROM assignments 
LIMIT 3;

SELECT 'Assignment Submissions Sample:' as info;  
SELECT id, assignment_id, student_id, file_name, marks, submitted_at
FROM assignment_submissions 
LIMIT 3;