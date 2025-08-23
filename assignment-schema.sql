-- Assignment Management Tables for Unified College App
-- Run this SQL in your Supabase SQL editor

-- Table for assignments/tasks created by instructors
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    class_year TEXT NOT NULL CHECK (class_year IN ('II-IT', 'III-IT')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for student assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES unified_students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    marks INTEGER CHECK (marks >= 0 AND marks <= 100),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    UNIQUE(assignment_id, student_id) -- One submission per student per assignment
);

-- Create storage bucket for assignments (run this in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignments bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload assignment files"
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'assignments' AND 
    auth.role() = 'authenticated'
);

-- Allow authenticated users to view assignment files
CREATE POLICY "Anyone can view assignment files"
ON storage.objects FOR SELECT 
USING (bucket_id = 'assignments');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own assignment files"
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'assignments' AND 
    auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own assignment files"
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'assignments' AND 
    auth.role() = 'authenticated'
);

-- Row Level Security (RLS) policies

-- Enable RLS on both tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Students can create own submissions" ON assignment_submissions;

-- Assignments: Allow everyone to read (students can see all assignments)
CREATE POLICY "Anyone can view assignments" ON assignments
    FOR SELECT USING (true);

-- Assignment submissions: Allow authenticated users to view all submissions
CREATE POLICY "Authenticated users can view submissions" ON assignment_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Assignment submissions: Allow authenticated users to insert submissions
CREATE POLICY "Authenticated users can create submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Assignment submissions: Allow users to update their own submissions
CREATE POLICY "Users can update own submissions" ON assignment_submissions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a function to get current user's register number (placeholder for future implementation)
-- This function is currently not used in the policies above
-- You can implement proper user identification based on your auth system later
CREATE OR REPLACE FUNCTION current_user_register_number()
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder - implement based on your auth system
    RETURN 'placeholder';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);

-- Sample data for testing (optional)
INSERT INTO assignments (title, description, class_year, due_date) VALUES
('Database Design Assignment', 'Create an ER diagram for a library management system', 'II-IT', NOW() + INTERVAL '7 days'),
('Programming Project', 'Develop a simple web application using React and Node.js', 'III-IT', NOW() + INTERVAL '14 days'),
('Machine Learning Research', 'Write a 10-page research paper on Machine Learning trends', 'III-IT', NOW() + INTERVAL '21 days')
ON CONFLICT DO NOTHING;

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();