-- Debug queries to check assignment system status
-- Run these in your Supabase SQL editor to diagnose the "No assignments" issue

-- 1. Check if there are any assignments in the database
SELECT 
    id, 
    title, 
    class_year, 
    due_date, 
    created_at 
FROM assignments 
ORDER BY created_at DESC;

-- 2. Check students and their class_year values
SELECT 
    id,
    register_number,
    name,
    class_year,
    created_at
FROM unified_students 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if any students have NULL or empty class_year
SELECT 
    COUNT(*) as total_students,
    COUNT(class_year) as students_with_class_year,
    COUNT(*) - COUNT(class_year) as students_without_class_year
FROM unified_students;

-- 4. Check class_year distribution
SELECT 
    class_year,
    COUNT(*) as student_count
FROM unified_students 
GROUP BY class_year;

-- 5. Check constraint on assignments table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'assignments'::regclass 
AND contype = 'c';