-- Fix student class years based on register number pattern
-- Run these commands in your Supabase SQL editor

-- First, let's see what we have
SELECT register_number, class_year FROM unified_students ORDER BY register_number;

-- Update students to have proper class years based on register number patterns
-- Assuming 4th and 5th digits indicate year (20=2020, 21=2021, 22=2022, 23=2023)
-- 2020-2021 students would be in 3rd year (III IT)
-- 2022-2023 students would be in 2nd year (II IT)

-- Update 2020-2021 students to III IT (3rd year)
UPDATE unified_students 
SET class_year = 'III IT' 
WHERE (
    SUBSTRING(register_number, 4, 2) IN ('20', '21')
    OR register_number LIKE '%20%'
    OR register_number LIKE '%21%'
) AND (class_year IS NULL OR class_year = '');

-- Update 2022-2023 students to II IT (2nd year)  
UPDATE unified_students 
SET class_year = 'II IT' 
WHERE (
    SUBSTRING(register_number, 4, 2) IN ('22', '23')
    OR register_number LIKE '%22%'
    OR register_number LIKE '%23%'
) AND (class_year IS NULL OR class_year = '');

-- If the above doesn't work, set a default for all NULL class_year students
-- You can manually adjust this based on your actual student data
UPDATE unified_students 
SET class_year = 'II IT' 
WHERE class_year IS NULL OR class_year = '';

-- Verify the changes
SELECT 
    class_year,
    COUNT(*) as student_count,
    array_agg(register_number ORDER BY register_number) as sample_register_numbers
FROM unified_students 
GROUP BY class_year;