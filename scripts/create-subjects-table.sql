-- Create subjects table for storing subject codes and credits
-- This table is used for GPA calculations in the results feature

CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  subject_name VARCHAR(255),
  credits INTEGER NOT NULL DEFAULT 3,
  semester INTEGER,
  year INTEGER,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code);

-- Insert common Anna University IT subjects with their credits
INSERT INTO subjects (subject_code, subject_name, credits, semester, year) VALUES
-- First Year
('HS3151', 'Professional English - I', 3, 1, 1),
('MA3151', 'Matrices and Calculus', 4, 1, 1),
('PH3151', 'Engineering Physics', 3, 1, 1),
('CY3151', 'Engineering Chemistry', 3, 1, 1),
('GE3151', 'Problem Solving and Python Programming', 3, 1, 1),
('GE3171', 'Problem Solving and Python Programming Laboratory', 2, 1, 1),
('BS3171', 'Physics and Chemistry Laboratory', 2, 1, 1),

('HS3252', 'Professional English - II', 2, 2, 1),
('MA3251', 'Statistics and Numerical Methods', 4, 2, 1),
('PH3256', 'Physics for Information Science', 3, 2, 1),
('BE3251', 'Basic Electrical and Electronics Engineering', 3, 2, 1),
('GE3251', 'Engineering Graphics', 4, 2, 1),
('GE3271', 'Engineering Graphics Laboratory', 2, 2, 1),
('BE3271', 'Basic Electrical and Electronics Engineering Laboratory', 2, 2, 1),

-- Second Year
('HS3351', 'Professional English - III', 3, 3, 2),
('MA3354', 'Discrete Mathematics', 4, 3, 2),
('CS3351', 'Digital Principles and Computer Organization', 4, 3, 2),
('CS3352', 'Foundations of Data Science', 3, 3, 2),
('CS3361', 'Data Structures Laboratory', 2, 3, 2),
('CS3381', 'Object Oriented Programming Laboratory', 2, 3, 2),
('CS3311', 'Data Structures', 3, 3, 2),

('MA3391', 'Probability and Statistics', 4, 4, 2),
('CS3391', 'Object Oriented Programming', 3, 4, 2),
('CS3401', 'Algorithms', 4, 4, 2),
('CS3451', 'Introduction to Operating Systems', 4, 4, 2),
('GE3361', 'Professional Development', 1, 4, 2),
('CS3461', 'Operating Systems Laboratory', 2, 4, 2),
('CS3471', 'Algorithms Laboratory', 2, 4, 2),

-- Third Year (Common subjects)
('CS3501', 'Compiler Design', 4, 5, 3),
('CS3551', 'Distributed Computing', 4, 5, 3),
('CS3591', 'Computer Networks', 4, 5, 3),
('CS3561', 'Networks Laboratory', 2, 5, 3),
('CS3571', 'Distributed Computing Laboratory', 2, 5, 3),

('CS3601', 'Software Engineering', 3, 6, 3),
('CS3651', 'Database Management Systems', 3, 6, 3),
('CS3691', 'Embedded Systems and IoT', 3, 6, 3),
('CS3661', 'Database Management Systems Laboratory', 2, 6, 3),
('CS3671', 'Software Engineering Laboratory', 2, 6, 3),

-- Add more subjects as needed
('CD3291', 'Data Structures and Algorithms', 4, 3, 2),
('GE3361', 'Professional Development', 1, 4, 2)

ON CONFLICT (subject_code) DO UPDATE SET
  subject_name = EXCLUDED.subject_name,
  credits = EXCLUDED.credits,
  semester = EXCLUDED.semester,
  year = EXCLUDED.year,
  updated_at = NOW();

-- Enable RLS but allow public read access for subject credits
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for GPA calculations)
CREATE POLICY "Allow public read access to subjects" ON subjects
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update (for admin purposes)
CREATE POLICY "Allow authenticated users to modify subjects" ON subjects
  FOR ALL USING (auth.role() = 'authenticated');
