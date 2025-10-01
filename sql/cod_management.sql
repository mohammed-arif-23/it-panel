-- Concept of the Day (COD) Management - Database Schema
-- This script creates all necessary tables for COD functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- COD Bookings Table
-- Students book slots for presenting their Concept of the Day
CREATE TABLE IF NOT EXISTS unified_cod_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    cod_topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, booking_date)
);

-- COD Selections Table
-- Random selection results (one per class per day)
CREATE TABLE IF NOT EXISTS unified_cod_selections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    cod_date DATE NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    class_year VARCHAR(10),
    UNIQUE(cod_date, class_year)
);

-- COD Attendance Tracking Table
-- Track student attendance for COD presentations
CREATE TABLE IF NOT EXISTS unified_cod_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    cod_date DATE NOT NULL,
    attendance_status VARCHAR(20) CHECK (attendance_status IN ('present', 'absent', 'excused', 'pending')) DEFAULT 'pending',
    attendance_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    cod_topic TEXT,
    marked_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COD Reschedule History Table
-- Track COD reschedules due to holidays
CREATE TABLE IF NOT EXISTS unified_cod_reschedule_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    holiday_id UUID REFERENCES unified_holidays(id),
    original_date DATE NOT NULL,
    new_date DATE NOT NULL,
    cod_topic VARCHAR(255),
    class_year VARCHAR(10) NOT NULL,
    student_id UUID REFERENCES unified_students(id),
    reschedule_reason TEXT,
    rescheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rescheduled_by VARCHAR(100) NOT NULL
);

-- Indexes for Performance Optimization

-- COD Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_cod_bookings_student_id ON unified_cod_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_cod_bookings_booking_date ON unified_cod_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_cod_bookings_created_at ON unified_cod_bookings(created_at);

-- COD Selections Indexes
CREATE INDEX IF NOT EXISTS idx_cod_selections_student_id ON unified_cod_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_cod_selections_cod_date ON unified_cod_selections(cod_date);
CREATE INDEX IF NOT EXISTS idx_cod_selections_class_year ON unified_cod_selections(class_year);
CREATE INDEX IF NOT EXISTS idx_cod_selections_selected_at ON unified_cod_selections(selected_at);

-- COD Attendance Indexes
CREATE INDEX IF NOT EXISTS idx_cod_attendance_student_id ON unified_cod_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_cod_attendance_cod_date ON unified_cod_attendance(cod_date);
CREATE INDEX IF NOT EXISTS idx_cod_attendance_status ON unified_cod_attendance(attendance_status);

-- COD Reschedule History Indexes
CREATE INDEX IF NOT EXISTS idx_cod_reschedule_original_date ON unified_cod_reschedule_history(original_date);
CREATE INDEX IF NOT EXISTS idx_cod_reschedule_new_date ON unified_cod_reschedule_history(new_date);
CREATE INDEX IF NOT EXISTS idx_cod_reschedule_student_id ON unified_cod_reschedule_history(student_id);

-- Triggers for Automatic Updates

-- Trigger to populate class_year in COD selections from student data
CREATE OR REPLACE FUNCTION populate_cod_selection_class_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.class_year IS NULL THEN
        SELECT class_year INTO NEW.class_year
        FROM unified_students
        WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_populate_cod_selection_class_year
    BEFORE INSERT ON unified_cod_selections
    FOR EACH ROW
    EXECUTE FUNCTION populate_cod_selection_class_year();

-- Trigger to update attendance updated_at timestamp
CREATE OR REPLACE FUNCTION update_cod_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cod_attendance_updated_at
    BEFORE UPDATE ON unified_cod_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_cod_attendance_updated_at();

-- Views for Easy Querying

-- View for today's COD selections with student details
CREATE OR REPLACE VIEW v_today_cod_selections AS
SELECT 
    cs.id,
    cs.student_id,
    cs.cod_date,
    cs.selected_at,
    cs.class_year,
    s.register_number,
    s.name,
    s.email,
    b.cod_topic
FROM unified_cod_selections cs
JOIN unified_students s ON cs.student_id = s.id
LEFT JOIN unified_cod_bookings b ON cs.student_id = b.student_id AND cs.cod_date = b.booking_date
WHERE cs.cod_date = CURRENT_DATE;

-- View for upcoming COD bookings
CREATE OR REPLACE VIEW v_upcoming_cod_bookings AS
SELECT 
    b.id,
    b.student_id,
    b.booking_date,
    b.cod_topic,
    b.created_at,
    s.register_number,
    s.name,
    s.email,
    s.class_year
FROM unified_cod_bookings b
JOIN unified_students s ON b.student_id = s.id
WHERE b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date ASC;

-- View for COD presentation history
CREATE OR REPLACE VIEW v_cod_presentation_history AS
SELECT 
    cs.id,
    cs.student_id,
    cs.cod_date,
    cs.selected_at,
    cs.class_year,
    s.register_number,
    s.name,
    s.email,
    b.cod_topic,
    a.attendance_status,
    a.notes
FROM unified_cod_selections cs
JOIN unified_students s ON cs.student_id = s.id
LEFT JOIN unified_cod_bookings b ON cs.student_id = b.student_id AND cs.cod_date = b.booking_date
LEFT JOIN unified_cod_attendance a ON cs.student_id = a.student_id AND cs.cod_date = a.cod_date
WHERE cs.cod_date < CURRENT_DATE
ORDER BY cs.cod_date DESC, cs.selected_at DESC;

-- View for students who have never been selected for COD
CREATE OR REPLACE VIEW v_cod_never_selected_students AS
SELECT 
    s.id,
    s.register_number,
    s.name,
    s.email,
    s.class_year,
    s.created_at
FROM unified_students s
LEFT JOIN unified_cod_selections cs ON s.id = cs.student_id
WHERE cs.id IS NULL
AND s.class_year IN ('II-IT', 'III-IT')
ORDER BY s.class_year, s.register_number;

-- Utility Functions

-- Function to get next eligible COD students (never selected before)
CREATE OR REPLACE FUNCTION get_eligible_cod_students(target_class_year VARCHAR(10))
RETURNS TABLE (
    student_id UUID,
    register_number VARCHAR(20),
    name VARCHAR(100),
    email VARCHAR(255),
    class_year VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.register_number,
        s.name,
        s.email,
        s.class_year
    FROM unified_students s
    LEFT JOIN unified_cod_selections cs ON s.id = cs.student_id
    WHERE s.class_year = target_class_year
    AND cs.id IS NULL
    ORDER BY s.register_number;
END;
$$ LANGUAGE plpgsql;

-- Function to count COD presentations by student
CREATE OR REPLACE FUNCTION count_cod_presentations(target_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
    presentation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO presentation_count
    FROM unified_cod_selections
    WHERE student_id = target_student_id;
    
    RETURN presentation_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for Documentation
COMMENT ON TABLE unified_cod_bookings IS 'Stores student bookings for Concept of the Day presentations';
COMMENT ON TABLE unified_cod_selections IS 'Stores random selection results for COD presentations (one per class per day)';
COMMENT ON TABLE unified_cod_attendance IS 'Tracks student attendance for COD presentations';
COMMENT ON TABLE unified_cod_reschedule_history IS 'Tracks COD reschedules due to holidays or other reasons';

COMMENT ON COLUMN unified_cod_bookings.cod_topic IS 'The topic/concept the student plans to present';
COMMENT ON COLUMN unified_cod_selections.class_year IS 'Automatically populated from student data, ensures one selection per class';
COMMENT ON COLUMN unified_cod_attendance.attendance_status IS 'Status: present, absent, excused, or pending';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON unified_cod_bookings TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON unified_cod_selections TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON unified_cod_attendance TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON unified_cod_reschedule_history TO your_app_user;
-- GRANT SELECT ON v_today_cod_selections TO your_app_user;
-- GRANT SELECT ON v_upcoming_cod_bookings TO your_app_user;
-- GRANT SELECT ON v_cod_presentation_history TO your_app_user;
-- GRANT SELECT ON v_cod_never_selected_students TO your_app_user;

-- Initial Data Setup (Optional)
-- You can add any initial COD configurations here

-- Example: Insert test COD booking (uncomment to use)
-- INSERT INTO unified_cod_bookings (student_id, booking_date, cod_topic)
-- SELECT id, CURRENT_DATE + INTERVAL '1 day', 'Introduction to Machine Learning'
-- FROM unified_students
-- WHERE register_number = 'TEST001'
-- LIMIT 1;
