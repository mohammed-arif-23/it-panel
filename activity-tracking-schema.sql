-- Activity Tracking System Tables for Unified College App
-- Run these SQL commands in your Supabase SQL editor

-- 1. User Activity Logs Table
-- Comprehensive tracking of all user activities
CREATE TABLE IF NOT EXISTS unified_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'profile_update', 'password_change',
        'assignment_view', 'assignment_submit', 'assignment_download',
        'seminar_book', 'seminar_cancel', 'seminar_view',
        'nptel_access', 'nptel_progress', 'nptel_complete',
        'fine_view', 'fine_pay', 'notification_read', 'notification_click',
        'system_access', 'data_export', 'settings_change', 'error_occurred'
    )),
    activity_description TEXT NOT NULL,
    resource_type TEXT, -- 'assignment', 'seminar', 'nptel_course', etc.
    resource_id TEXT, -- ID of the specific resource
    metadata JSONB, -- Additional activity-specific data
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    device_info JSONB,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Login Sessions Table
-- Detailed login session tracking
CREATE TABLE IF NOT EXISTS unified_login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    ip_address INET,
    user_agent TEXT,
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    location_country TEXT,
    location_city TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pages_visited INTEGER DEFAULT 0,
    actions_performed INTEGER DEFAULT 0
);

-- 3. Assignment Activity Tracking
CREATE TABLE IF NOT EXISTS unified_assignment_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'viewed', 'downloaded', 'started', 'saved_draft', 'submitted', 'resubmitted', 'graded_viewed'
    )),
    time_spent_minutes INTEGER,
    submission_file_name TEXT,
    submission_file_size INTEGER,
    submission_file_type TEXT,
    grade_received DECIMAL(5,2),
    feedback_viewed BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Seminar Activity Tracking
CREATE TABLE IF NOT EXISTS unified_seminar_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    seminar_date DATE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'booking_viewed', 'booked', 'booking_cancelled', 'selected', 'attended', 
        'absent', 'presentation_uploaded', 'feedback_submitted', 'evaluation_viewed'
    )),
    seminar_topic TEXT,
    booking_attempts INTEGER DEFAULT 1,
    cancellation_reason TEXT,
    attendance_marked_by TEXT,
    presentation_file_name TEXT,
    presentation_file_size INTEGER,
    evaluation_score DECIMAL(5,2),
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. NPTEL Activity Tracking
CREATE TABLE IF NOT EXISTS unified_nptel_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    course_id TEXT,
    course_name TEXT,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'course_accessed', 'week_started', 'week_completed', 'assignment_submitted',
        'quiz_attempted', 'video_watched', 'certificate_downloaded', 'progress_updated'
    )),
    week_number INTEGER,
    progress_percentage DECIMAL(5,2),
    time_spent_minutes INTEGER,
    video_watch_percentage DECIMAL(5,2),
    quiz_score DECIMAL(5,2),
    assignment_score DECIMAL(5,2),
    certificate_obtained BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. System Error Logs
CREATE TABLE IF NOT EXISTS unified_error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    error_message TEXT,
    error_code TEXT,
    stack_trace TEXT,
    url_path TEXT,
    request_method TEXT,
    request_body JSONB,
    response_status INTEGER,
    browser_info JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Data Access Logs (for GDPR compliance and security)
CREATE TABLE IF NOT EXISTS unified_data_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    accessed_by_student_id UUID REFERENCES unified_students(id),
    accessed_by_admin_id TEXT,
    access_type TEXT NOT NULL CHECK (access_type IN (
        'view', 'export', 'modify', 'delete', 'share', 'download'
    )),
    data_type TEXT NOT NULL,
    data_description TEXT,
    justification TEXT,
    ip_address INET,
    user_agent TEXT,
    approved_by TEXT,
    retention_period INTEGER, -- days
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_student_id ON unified_activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON unified_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON unified_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON unified_activity_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_login_sessions_student_id ON unified_login_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON unified_login_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_login_sessions_login_time ON unified_login_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON unified_login_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_assignment_activities_student_id ON unified_assignment_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_activities_assignment_id ON unified_assignment_activities(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_activities_type ON unified_assignment_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_seminar_activities_student_id ON unified_seminar_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_seminar_activities_date ON unified_seminar_activities(seminar_date);
CREATE INDEX IF NOT EXISTS idx_seminar_activities_type ON unified_seminar_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_nptel_activities_student_id ON unified_nptel_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_nptel_activities_course ON unified_nptel_activities(course_id);
CREATE INDEX IF NOT EXISTS idx_nptel_activities_type ON unified_nptel_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_student_id ON unified_error_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON unified_error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON unified_error_logs(severity);

-- 9. Enable RLS
ALTER TABLE unified_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_assignment_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_seminar_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_nptel_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_data_access_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Students can view their own activity data
CREATE POLICY "Students can view their own activity logs" 
ON unified_activity_logs FOR SELECT 
USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can view their own login sessions" 
ON unified_login_sessions FOR SELECT 
USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can view their own assignment activities" 
ON unified_assignment_activities FOR SELECT 
USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can view their own seminar activities" 
ON unified_seminar_activities FOR SELECT 
USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can view their own NPTEL activities" 
ON unified_nptel_activities FOR SELECT 
USING (student_id = auth.uid()::uuid);

-- System can insert logs (service role)
CREATE POLICY "System can insert activity logs" 
ON unified_activity_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can insert login sessions" 
ON unified_login_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can insert assignment activities" 
ON unified_assignment_activities FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can insert seminar activities" 
ON unified_seminar_activities FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can insert NPTEL activities" 
ON unified_nptel_activities FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can insert error logs" 
ON unified_error_logs FOR INSERT 
WITH CHECK (true);

-- Admins have full access
CREATE POLICY "Admins have full access to all activity data" 
ON unified_activity_logs FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to login sessions" 
ON unified_login_sessions FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to assignment activities" 
ON unified_assignment_activities FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to seminar activities" 
ON unified_seminar_activities FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to NPTEL activities" 
ON unified_nptel_activities FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to error logs" 
ON unified_error_logs FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to data access logs" 
ON unified_data_access_logs FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

-- 11. Utility Functions

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_student_id UUID,
    p_activity_type TEXT,
    p_description TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO unified_activity_logs (
        student_id, activity_type, activity_description, resource_type, 
        resource_id, metadata, ip_address, user_agent, success, error_message
    ) VALUES (
        p_student_id, p_activity_type, p_description, p_resource_type,
        p_resource_id, p_metadata, p_ip_address, p_user_agent, p_success, p_error_message
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get activity statistics
CREATE OR REPLACE FUNCTION get_student_activity_stats(p_student_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_activities', COUNT(*),
        'login_count', COUNT(*) FILTER (WHERE activity_type = 'login'),
        'assignment_activities', COUNT(*) FILTER (WHERE activity_type LIKE 'assignment_%'),
        'seminar_activities', COUNT(*) FILTER (WHERE activity_type LIKE 'seminar_%'),
        'nptel_activities', COUNT(*) FILTER (WHERE activity_type LIKE 'nptel_%'),
        'most_active_day', mode() WITHIN GROUP (ORDER BY date_trunc('day', created_at)),
        'activity_by_type', json_object_agg(
            activity_type, 
            COUNT(*)
        )
    ) INTO result
    FROM unified_activity_logs
    WHERE student_id = p_student_id
    AND created_at >= NOW() - INTERVAL '%s days' % p_days
    GROUP BY student_id;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    login_from_different_locations INTEGER;
    rapid_fire_submissions INTEGER;
    unusual_access_hours INTEGER;
BEGIN
    -- Check for logins from different locations within short timeframe
    SELECT COUNT(DISTINCT location_city) INTO login_from_different_locations
    FROM unified_login_sessions
    WHERE student_id = p_student_id
    AND login_time >= NOW() - INTERVAL '1 hour'
    AND location_city IS NOT NULL;
    
    -- Check for rapid-fire submissions
    SELECT COUNT(*) INTO rapid_fire_submissions
    FROM unified_assignment_activities
    WHERE student_id = p_student_id
    AND activity_type = 'submitted'
    AND created_at >= NOW() - INTERVAL '5 minutes'
    GROUP BY date_trunc('minute', created_at)
    HAVING COUNT(*) > 3;
    
    -- Check for unusual access hours (between 2 AM and 5 AM)
    SELECT COUNT(*) INTO unusual_access_hours
    FROM unified_activity_logs
    WHERE student_id = p_student_id
    AND EXTRACT(HOUR FROM created_at) BETWEEN 2 AND 5
    AND created_at >= NOW() - INTERVAL '7 days';
    
    SELECT json_build_object(
        'multiple_locations', login_from_different_locations > 1,
        'rapid_submissions', rapid_fire_submissions > 0,
        'unusual_hours', unusual_access_hours > 10,
        'risk_score', (
            CASE WHEN login_from_different_locations > 1 THEN 30 ELSE 0 END +
            CASE WHEN rapid_fire_submissions > 0 THEN 50 ELSE 0 END +
            CASE WHEN unusual_access_hours > 10 THEN 20 ELSE 0 END
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Cleanup function for old logs
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
    -- Delete activity logs older than 2 years
    DELETE FROM unified_activity_logs 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Delete inactive login sessions older than 6 months
    DELETE FROM unified_login_sessions 
    WHERE is_active = false AND logout_time < NOW() - INTERVAL '6 months';
    
    -- Delete resolved error logs older than 1 year
    DELETE FROM unified_error_logs 
    WHERE resolved = true AND resolved_at < NOW() - INTERVAL '1 year';
    
    -- Archive old assignment activities (move to archive table if needed)
    -- For now, just delete activities older than 3 years
    DELETE FROM unified_assignment_activities 
    WHERE created_at < NOW() - INTERVAL '3 years';
    
    DELETE FROM unified_seminar_activities 
    WHERE created_at < NOW() - INTERVAL '3 years';
    
    DELETE FROM unified_nptel_activities 
    WHERE created_at < NOW() - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- 13. Add comments for documentation
COMMENT ON TABLE unified_activity_logs IS 'Comprehensive audit trail of all user activities in the system';
COMMENT ON TABLE unified_login_sessions IS 'Detailed login session tracking with device and location information';
COMMENT ON TABLE unified_assignment_activities IS 'Specific tracking for assignment-related activities';
COMMENT ON TABLE unified_seminar_activities IS 'Specific tracking for seminar-related activities';
COMMENT ON TABLE unified_nptel_activities IS 'Specific tracking for NPTEL course activities';
COMMENT ON TABLE unified_error_logs IS 'System error tracking for debugging and monitoring';
COMMENT ON TABLE unified_data_access_logs IS 'Data access audit for privacy and security compliance';

COMMENT ON FUNCTION log_user_activity IS 'Convenience function to log user activities with proper validation';
COMMENT ON FUNCTION get_student_activity_stats IS 'Generate activity statistics for a student over a specified period';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Analyze user activity patterns to detect potential security issues';
COMMENT ON FUNCTION cleanup_old_activity_logs IS 'Maintenance function to clean up old activity logs and maintain database performance';