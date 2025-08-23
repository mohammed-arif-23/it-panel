-- SQL commands to remove "Both" class option from assignments system
-- Run these commands in your Supabase SQL editor

-- 1. Delete any existing assignments with class_year = 'Both'
DELETE FROM assignments WHERE class_year = 'Both';

-- 2. Drop the existing constraint
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_class_year_check;

-- 3. Add new constraint without 'Both' option (using hyphen format)
ALTER TABLE assignments ADD CONSTRAINT assignments_class_year_check 
    CHECK (class_year IN ('II-IT', 'III-IT'));

-- 4. Verify the changes
SELECT class_year, COUNT(*) as count 
FROM assignments 
GROUP BY class_year;