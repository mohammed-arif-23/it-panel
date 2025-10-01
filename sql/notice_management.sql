-- Notice Management System - Database Schema
-- This script creates all necessary tables for college/department notices

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notices Table
CREATE TABLE IF NOT EXISTS unified_notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    notice_type VARCHAR(50) CHECK (notice_type IN ('general', 'urgent', 'event', 'exam', 'holiday', 'announcement', 'academic', 'administrative')) DEFAULT 'general',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'students', 'II-IT', 'III-IT', 'faculty', 'staff')) DEFAULT 'all',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    views_count INTEGER DEFAULT 0,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notice Views Tracking Table (to track which students have seen which notices)
CREATE TABLE IF NOT EXISTS unified_notice_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notice_id UUID REFERENCES unified_notices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notice_id, student_id)
);

-- Notice Acknowledgments Table (for important notices requiring confirmation)
CREATE TABLE IF NOT EXISTS unified_notice_acknowledgments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    notice_id UUID REFERENCES unified_notices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES unified_students(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    UNIQUE(notice_id, student_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notices_published ON unified_notices(is_published);
CREATE INDEX IF NOT EXISTS idx_notices_type ON unified_notices(notice_type);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON unified_notices(priority);
CREATE INDEX IF NOT EXISTS idx_notices_target_audience ON unified_notices(target_audience);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON unified_notices(published_at);
CREATE INDEX IF NOT EXISTS idx_notices_expires_at ON unified_notices(expires_at);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON unified_notices(created_at);

CREATE INDEX IF NOT EXISTS idx_notice_views_notice_id ON unified_notice_views(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_views_student_id ON unified_notice_views(student_id);
CREATE INDEX IF NOT EXISTS idx_notice_views_viewed_at ON unified_notice_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_notice_acks_notice_id ON unified_notice_acknowledgments(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_acks_student_id ON unified_notice_acknowledgments(student_id);

-- Triggers

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notice_updated_at
    BEFORE UPDATE ON unified_notices
    FOR EACH ROW
    EXECUTE FUNCTION update_notice_updated_at();

-- Trigger to set published_at when notice is published
CREATE OR REPLACE FUNCTION set_notice_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notice_published_at
    BEFORE UPDATE ON unified_notices
    FOR EACH ROW
    EXECUTE FUNCTION set_notice_published_at();

-- Trigger to increment views count when a view is recorded
CREATE OR REPLACE FUNCTION increment_notice_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE unified_notices
    SET views_count = views_count + 1
    WHERE id = NEW.notice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_notice_views
    AFTER INSERT ON unified_notice_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_notice_views();

-- Views for Easy Querying

-- View for active published notices
CREATE OR REPLACE VIEW v_active_notices AS
SELECT 
    n.*,
    COALESCE(v.view_count, 0) as total_views,
    COALESCE(a.ack_count, 0) as total_acknowledgments
FROM unified_notices n
LEFT JOIN (
    SELECT notice_id, COUNT(*) as view_count
    FROM unified_notice_views
    GROUP BY notice_id
) v ON n.id = v.notice_id
LEFT JOIN (
    SELECT notice_id, COUNT(*) as ack_count
    FROM unified_notice_acknowledgments
    GROUP BY notice_id
) a ON n.id = a.notice_id
WHERE n.is_published = true
AND (n.expires_at IS NULL OR n.expires_at > NOW())
ORDER BY n.priority DESC, n.published_at DESC;

-- View for urgent notices
CREATE OR REPLACE VIEW v_urgent_notices AS
SELECT *
FROM unified_notices
WHERE is_published = true
AND priority IN ('high', 'urgent')
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY published_at DESC;

-- View for notice statistics
CREATE OR REPLACE VIEW v_notice_statistics AS
SELECT 
    n.id,
    n.title,
    n.notice_type,
    n.priority,
    n.target_audience,
    n.published_at,
    n.views_count,
    COUNT(DISTINCT nv.student_id) as unique_views,
    COUNT(DISTINCT na.student_id) as acknowledgment_count,
    CASE 
        WHEN n.target_audience = 'all' THEN 
            (SELECT COUNT(*) FROM unified_students)
        WHEN n.target_audience IN ('II-IT', 'III-IT') THEN
            (SELECT COUNT(*) FROM unified_students WHERE class_year = n.target_audience)
        ELSE 0
    END as target_count
FROM unified_notices n
LEFT JOIN unified_notice_views nv ON n.id = nv.notice_id
LEFT JOIN unified_notice_acknowledgments na ON n.id = na.notice_id
WHERE n.is_published = true
GROUP BY n.id, n.title, n.notice_type, n.priority, n.target_audience, n.published_at, n.views_count;

-- Utility Functions

-- Function to get notices for a specific student
CREATE OR REPLACE FUNCTION get_student_notices(target_student_id UUID, target_class_year VARCHAR(10))
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    notice_type VARCHAR(50),
    priority VARCHAR(20),
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    has_viewed BOOLEAN,
    has_acknowledged BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.content,
        n.notice_type,
        n.priority,
        n.published_at,
        n.expires_at,
        n.attachment_url,
        n.attachment_name,
        EXISTS(SELECT 1 FROM unified_notice_views WHERE notice_id = n.id AND student_id = target_student_id) as has_viewed,
        EXISTS(SELECT 1 FROM unified_notice_acknowledgments WHERE notice_id = n.id AND student_id = target_student_id) as has_acknowledged
    FROM unified_notices n
    WHERE n.is_published = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
        n.target_audience = 'all' 
        OR n.target_audience = 'students'
        OR n.target_audience = target_class_year
    )
    ORDER BY 
        CASE n.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        n.published_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notice as viewed by student
CREATE OR REPLACE FUNCTION mark_notice_viewed(target_notice_id UUID, target_student_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO unified_notice_views (notice_id, student_id, viewed_at)
    VALUES (target_notice_id, target_student_id, NOW())
    ON CONFLICT (notice_id, student_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notice count for student
CREATE OR REPLACE FUNCTION get_unread_notice_count(target_student_id UUID, target_class_year VARCHAR(10))
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM unified_notices n
    WHERE n.is_published = true
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
        n.target_audience = 'all' 
        OR n.target_audience = 'students'
        OR n.target_audience = target_class_year
    )
    AND NOT EXISTS (
        SELECT 1 FROM unified_notice_views 
        WHERE notice_id = n.id AND student_id = target_student_id
    );
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired notices (can be run by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_notices()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Optionally, instead of deleting, you can archive them
    DELETE FROM unified_notices
    WHERE expires_at < NOW() - INTERVAL '90 days'
    AND is_published = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for Documentation
COMMENT ON TABLE unified_notices IS 'Stores college/department notices and announcements';
COMMENT ON TABLE unified_notice_views IS 'Tracks which students have viewed which notices';
COMMENT ON TABLE unified_notice_acknowledgments IS 'Tracks student acknowledgments for important notices';

COMMENT ON COLUMN unified_notices.notice_type IS 'Type of notice: general, urgent, event, exam, holiday, announcement, academic, administrative';
COMMENT ON COLUMN unified_notices.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN unified_notices.target_audience IS 'Who should see this: all, students, II-IT, III-IT, faculty, staff';
COMMENT ON COLUMN unified_notices.is_published IS 'Whether the notice is published and visible';
COMMENT ON COLUMN unified_notices.expires_at IS 'When the notice should no longer be shown (optional)';

-- Initial Data (Optional - Sample notices)
-- Uncomment to add sample data

-- INSERT INTO unified_notices (title, content, notice_type, priority, target_audience, is_published, created_by)
-- VALUES 
-- ('Welcome to IT Department', 'Welcome to the Information Technology Department! We are excited to have you here.', 'general', 'medium', 'all', true, 'admin'),
-- ('Semester Exam Schedule', 'The semester exam schedule has been updated. Please check the academic calendar for details.', 'exam', 'high', 'students', true, 'admin'),
-- ('Holiday Notice', 'The college will remain closed on account of national holiday.', 'holiday', 'high', 'all', true, 'admin');
