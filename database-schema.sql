-- Unified College Application System - Database Schema
-- This script creates all necessary tables for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Tables

-- Students table (main user table)
CREATE TABLE IF NOT EXISTS unified_students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(15),
    class_year VARCHAR(10),
    password TEXT, -- For password verification feature
    email_verified BOOLEAN DEFAULT false,
    total_fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student registrations (tracks service registrations)
CREATE TABLE IF NOT EXISTS unified_student_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    registration_type VARCHAR(10) CHECK (registration_type IN ('nptel', 'seminar', 'both')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- NPTEL Tables

-- NPTEL course enrollments
CREATE TABLE IF NOT EXISTS unified_nptel_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    course_duration INTEGER DEFAULT 12,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- NPTEL progress tracking
CREATE TABLE IF NOT EXISTS unified_nptel_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    enrollment_id UUID REFERENCES unified_nptel_enrollments(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(enrollment_id, week_number)
);

-- Seminar Tables

-- Seminar bookings
CREATE TABLE IF NOT EXISTS unified_seminar_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    seminar_topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, booking_date)
);

-- Seminar selections (results of random selection)
CREATE TABLE IF NOT EXISTS unified_seminar_selections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    seminar_date DATE NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    class_year VARCHAR(10),
    UNIQUE(seminar_date, class_year)
);

-- Seminar attendance tracking
CREATE TABLE IF NOT EXISTS unified_seminar_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    seminar_date DATE NOT NULL,
    attendance_status VARCHAR(20) CHECK (attendance_status IN ('present', 'absent', 'excused', 'pending')) DEFAULT 'pending',
    attendance_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    seminar_topic TEXT,
    marked_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments Tables

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_year VARCHAR(10) NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    marks DECIMAL(5,2),
    status VARCHAR(20) CHECK (status IN ('submitted', 'graded')) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT
);

-- Fines Tables

-- Student fines
CREATE TABLE IF NOT EXISTS unified_student_fines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    fine_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(50),
    reference_date DATE NOT NULL,
    base_amount DECIMAL(10,2) DEFAULT 0.00,
    daily_increment DECIMAL(10,2) DEFAULT 0.00,
    days_overdue INTEGER DEFAULT 0,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'waived')) DEFAULT 'pending',
    paid_amount DECIMAL(10,2),
    paid_at TIMESTAMP WITH TIME ZONE,
    waived_by VARCHAR(100),
    waived_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holidays Tables

-- Holidays
CREATE TABLE IF NOT EXISTS unified_holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    holiday_name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(50) NOT NULL,
    description TEXT,
    is_announced BOOLEAN DEFAULT false,
    announced_date TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100) NOT NULL,
    affects_seminars BOOLEAN DEFAULT true,
    affects_assignments BOOLEAN DEFAULT false,
    affects_exams BOOLEAN DEFAULT false,
    reschedule_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(holiday_date)
);

-- Additional System Tables

-- Academic calendar
CREATE TABLE IF NOT EXISTS unified_academic_calendar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    class_year VARCHAR(10),
    department VARCHAR(50),
    is_fixed BOOLEAN DEFAULT false,
    priority_level INTEGER DEFAULT 0,
    description TEXT,
    recurring_pattern VARCHAR(100),
    created_by VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    approved_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday impact assessments
CREATE TABLE IF NOT EXISTS unified_holiday_impact_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    holiday_id UUID REFERENCES unified_holidays(id) ON DELETE CASCADE,
    impact_type VARCHAR(50) NOT NULL,
    affected_count INTEGER DEFAULT 0,
    impact_severity VARCHAR(20) CHECK (impact_severity IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seminar reschedule history
CREATE TABLE IF NOT EXISTS unified_seminar_reschedule_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    holiday_id UUID REFERENCES unified_holidays(id),
    original_date DATE NOT NULL,
    new_date DATE NOT NULL,
    seminar_topic VARCHAR(255),
    class_year VARCHAR(10) NOT NULL,
    reschedule_reason TEXT,
    reschedule_type VARCHAR(50),
    affected_students_count INTEGER DEFAULT 0,
    affected_bookings_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'confirmed',
    rescheduled_by VARCHAR(100) NOT NULL,
    auto_reschedule_rules JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto reschedule rules
CREATE TABLE IF NOT EXISTS unified_auto_reschedule_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    reschedule_logic JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked registrations
CREATE TABLE IF NOT EXISTS unified_blocked_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_number VARCHAR(20),
    email VARCHAR(255),
    mobile VARCHAR(15),
    block_type VARCHAR(50) NOT NULL,
    block_reason TEXT,
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT false,
    appeal_status VARCHAR(20),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registration attempts
CREATE TABLE IF NOT EXISTS unified_registration_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(15),
    name VARCHAR(100),
    class_year VARCHAR(10),
    attempt_status VARCHAR(20) NOT NULL,
    otp_verification_id VARCHAR(50),
    final_student_id UUID REFERENCES unified_students(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser_fingerprint TEXT,
    device_info JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email change history
CREATE TABLE IF NOT EXISTS unified_email_change_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    new_email VARCHAR(255) NOT NULL,
    change_reason TEXT,
    verification_method VARCHAR(50),
    otp_verification_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Duplicate detection logs
CREATE TABLE IF NOT EXISTS unified_duplicate_detection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(15),
    detection_type VARCHAR(50) NOT NULL,
    attempted_registration_data JSONB,
    action_taken TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unified_students_register_number ON unified_students(register_number);
CREATE INDEX IF NOT EXISTS idx_unified_students_email ON unified_students(email);
CREATE INDEX IF NOT EXISTS idx_unified_student_registrations_student_id ON unified_student_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_nptel_enrollments_student_id ON unified_nptel_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_nptel_progress_enrollment_id ON unified_nptel_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_bookings_student_id ON unified_seminar_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_bookings_booking_date ON unified_seminar_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_selections_seminar_date ON unified_seminar_selections(seminar_date);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_attendance_student_id ON unified_seminar_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_attendance_seminar_date ON unified_seminar_attendance(seminar_date);
CREATE INDEX IF NOT EXISTS idx_assignments_class_year ON assignments(class_year);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_student_fines_student_id ON unified_student_fines(student_id);
CREATE INDEX IF NOT EXISTS idx_unified_student_fines_payment_status ON unified_student_fines(payment_status);
CREATE INDEX IF NOT EXISTS idx_unified_holidays_holiday_date ON unified_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_reschedule_history_original_date ON unified_seminar_reschedule_history(original_date);
CREATE INDEX IF NOT EXISTS idx_unified_seminar_reschedule_history_new_date ON unified_seminar_reschedule_history(new_date);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_unified_students_updated_at BEFORE UPDATE ON unified_students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unified_seminar_attendance_updated_at BEFORE UPDATE ON unified_seminar_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unified_student_fines_updated_at BEFORE UPDATE ON unified_student_fines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unified_holidays_updated_at BEFORE UPDATE ON unified_holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unified_academic_calendar_updated_at BEFORE UPDATE ON unified_academic_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_unified_seminar_reschedule_history_updated_at BEFORE UPDATE ON unified_seminar_reschedule_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default auto reschedule rules
INSERT INTO unified_auto_reschedule_rules (rule_name, rule_type, priority, reschedule_logic, is_active) VALUES
('weekend_reschedule', 'weekend', 1, '{"days_to_add": 1}', true),
('holiday_reschedule', 'holiday', 2, '{"days_to_add": 1}', true)
ON CONFLICT DO NOTHING;