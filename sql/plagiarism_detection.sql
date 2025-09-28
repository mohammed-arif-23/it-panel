-- Add file_hash column to assignment_submissions table for plagiarism detection
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Create index for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_file_hash 
ON assignment_submissions(file_hash);

-- Add plagiarism detection metadata columns
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS plagiarism_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS matched_submission_id UUID REFERENCES assignment_submissions(id),
ADD COLUMN IF NOT EXISTS similarity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hash_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for plagiarism detection queries
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_plagiarism 
ON assignment_submissions(plagiarism_detected, matched_submission_id);

-- Add constraint to ensure hash is unique per assignment (optional)
-- This prevents multiple students from submitting the exact same file for the same assignment
-- ALTER TABLE assignment_submissions 
-- ADD CONSTRAINT unique_hash_per_assignment 
-- UNIQUE (assignment_id, file_hash);

-- Create a view for easy plagiarism detection queries
CREATE OR REPLACE VIEW plagiarism_matches AS
SELECT 
    s1.id as submission_id,
    s1.student_id as student_id,
    s1.assignment_id as assignment_id,
    s1.file_hash as file_hash,
    s1.file_name as file_name,
    s1.submitted_at as submitted_at,
    s1.plagiarism_detected as plagiarism_detected,
    s1.matched_submission_id as matched_submission_id,
    s1.similarity_score as similarity_score,
    us1.name as student_name,
    us1.register_number as student_register_number,
    us1.class_year as student_class_year,
    a.title as assignment_title,
    -- Matched submission details
    s2.student_id as matched_student_id,
    s2.file_name as matched_file_name,
    s2.submitted_at as matched_submitted_at,
    us2.name as matched_student_name,
    us2.register_number as matched_student_register_number,
    us2.class_year as matched_student_class_year
FROM assignment_submissions s1
LEFT JOIN assignment_submissions s2 ON s1.matched_submission_id = s2.id
LEFT JOIN unified_students us1 ON s1.student_id = us1.id
LEFT JOIN unified_students us2 ON s2.student_id = us2.id
LEFT JOIN assignments a ON s1.assignment_id = a.id
WHERE s1.file_hash IS NOT NULL
ORDER BY s1.submitted_at DESC;

-- Create function to check for hash matches
CREATE OR REPLACE FUNCTION check_hash_match(
    p_file_hash VARCHAR(64),
    p_student_id UUID,
    p_assignment_id UUID
)
RETURNS TABLE(
    match_found BOOLEAN,
    matched_student_name TEXT,
    matched_student_register_number TEXT,
    matched_submission_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as match_found,
        us.name as matched_student_name,
        us.register_number as matched_student_register_number,
        s.id as matched_submission_id
    FROM assignment_submissions s
    JOIN unified_students us ON s.student_id = us.id
    WHERE s.file_hash = p_file_hash
    AND s.student_id != p_student_id
    AND s.assignment_id = p_assignment_id
    LIMIT 1;
    
    -- If no match found, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::UUID;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update plagiarism_detected when file_hash is set
CREATE OR REPLACE FUNCTION update_plagiarism_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this hash already exists for the same assignment
    IF NEW.file_hash IS NOT NULL THEN
        -- Look for existing submissions with the same hash
        SELECT id INTO NEW.matched_submission_id
        FROM assignment_submissions
        WHERE file_hash = NEW.file_hash
        AND student_id != NEW.student_id
        AND assignment_id = NEW.assignment_id
        LIMIT 1;
        
        -- Set plagiarism status
        IF NEW.matched_submission_id IS NOT NULL THEN
            NEW.plagiarism_detected = TRUE;
            NEW.similarity_score = 100; -- Exact match
        ELSE
            NEW.plagiarism_detected = FALSE;
            NEW.similarity_score = 0;
        END IF;
        
        -- Set hash generation timestamp
        NEW.hash_generated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_plagiarism_status ON assignment_submissions;
CREATE TRIGGER trigger_update_plagiarism_status
    BEFORE INSERT OR UPDATE OF file_hash ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_plagiarism_status();
