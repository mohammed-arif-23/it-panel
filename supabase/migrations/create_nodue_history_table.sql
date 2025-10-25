-- Create nodue_history table for tracking certificate generation
CREATE TABLE IF NOT EXISTS nodue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  register_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  year INTEGER NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  marks_snapshot JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) 
    REFERENCES unified_students(id) 
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodue_history_student 
  ON nodue_history(student_id);

CREATE INDEX IF NOT EXISTS idx_nodue_history_register 
  ON nodue_history(register_number);

CREATE INDEX IF NOT EXISTS idx_nodue_history_date 
  ON nodue_history(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_nodue_history_class_semester 
  ON nodue_history(class_year, semester);

-- Add comment to table
COMMENT ON TABLE nodue_history IS 'Tracks No Due certificate generation history with marks snapshots';

-- Add comments to columns
COMMENT ON COLUMN nodue_history.marks_snapshot IS 'JSONB snapshot of marks and clearance status at time of generation';
COMMENT ON COLUMN nodue_history.pdf_url IS 'Optional URL to stored PDF file';
