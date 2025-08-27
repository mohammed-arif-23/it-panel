-- Holiday Management and Seminar Rescheduling System Tables
-- Run these SQL commands in your Supabase SQL editor

-- 1. Holidays Management Table
CREATE TABLE IF NOT EXISTS unified_holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_name TEXT NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type TEXT NOT NULL CHECK (holiday_type IN (
        'national', 'regional', 'college_specific', 'emergency', 'announced', 'unannounced'
    )),
    description TEXT,
    is_announced BOOLEAN DEFAULT true,
    announced_date DATE,
    created_by TEXT NOT NULL, -- Admin who created/announced the holiday
    affects_seminars BOOLEAN DEFAULT true,
    affects_assignments BOOLEAN DEFAULT false,
    affects_exams BOOLEAN DEFAULT false,
    reschedule_rules JSONB, -- Rules for how to reschedule affected events
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seminar Rescheduling History Table
CREATE TABLE IF NOT EXISTS unified_seminar_reschedule_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_seminar_id UUID, -- Reference to original seminar (if exists)
    holiday_id UUID REFERENCES unified_holidays(id) ON DELETE CASCADE,
    original_date DATE NOT NULL,
    new_date DATE NOT NULL,
    seminar_topic TEXT,
    class_year TEXT,
    reschedule_reason TEXT NOT NULL,
    reschedule_type TEXT NOT NULL CHECK (reschedule_type IN (
        'automatic', 'manual', 'bulk_reschedule'
    )),
    affected_students_count INTEGER DEFAULT 0,
    affected_bookings_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'cancelled', 'completed'
    )),
    rescheduled_by TEXT NOT NULL,
    auto_reschedule_rules JSONB, -- Rules used for automatic rescheduling
    notifications_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Holiday Impact Assessment Table
CREATE TABLE IF NOT EXISTS unified_holiday_impact_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_id UUID REFERENCES unified_holidays(id) ON DELETE CASCADE,
    impact_type TEXT NOT NULL CHECK (impact_type IN (
        'seminars', 'assignments', 'exams', 'bookings', 'attendance'
    )),
    affected_count INTEGER DEFAULT 0,
    affected_items JSONB, -- List of affected items with details
    impact_severity TEXT CHECK (impact_severity IN ('low', 'medium', 'high', 'critical')),
    estimated_reschedule_date DATE,
    mitigation_actions JSONB, -- Actions taken to mitigate impact
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'assessed', 'mitigated', 'resolved'
    )),
    assessed_by TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Academic Calendar Table
CREATE TABLE IF NOT EXISTS unified_academic_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'semester_start', 'semester_end', 'exam_period', 'holiday_period',
        'seminar_week', 'assignment_deadline', 'project_submission', 'break_period'
    )),
    start_date DATE NOT NULL,
    end_date DATE,
    class_year TEXT, -- NULL means applies to all years
    department TEXT DEFAULT 'IT',
    is_fixed BOOLEAN DEFAULT false, -- True for events that cannot be rescheduled
    priority_level INTEGER DEFAULT 1, -- 1 = highest priority
    description TEXT,
    recurring_pattern TEXT, -- For recurring events (weekly, monthly, yearly)
    created_by TEXT NOT NULL,
    approved_by TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'postponed', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Automatic Rescheduling Rules Table
CREATE TABLE IF NOT EXISTS unified_auto_reschedule_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'seminar_reschedule', 'assignment_extension', 'exam_postponement'
    )),
    trigger_conditions JSONB NOT NULL, -- Conditions that trigger this rule
    reschedule_logic JSONB NOT NULL, -- Logic for how to reschedule
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    applies_to_holiday_types TEXT[] DEFAULT ARRAY['unannounced', 'emergency'],
    min_notice_days INTEGER DEFAULT 1, -- Minimum days notice required
    max_reschedule_days INTEGER DEFAULT 30, -- Maximum days to reschedule ahead
    created_by TEXT NOT NULL,
    approved_by TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Holiday Notifications Log
CREATE TABLE IF NOT EXISTS unified_holiday_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_id UUID REFERENCES unified_holidays(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'holiday_announcement', 'seminar_reschedule', 'assignment_extension', 'general_notice'
    )),
    target_audience TEXT NOT NULL CHECK (target_audience IN (
        'all_students', 'specific_class', 'specific_students', 'faculty', 'admin'
    )),
    class_year TEXT, -- If target is specific_class
    student_ids UUID[], -- If target is specific_students
    notification_title TEXT NOT NULL,
    notification_body TEXT NOT NULL,
    notification_data JSONB, -- Additional data for the notification
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    delivery_stats JSONB,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_holidays_date ON unified_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_type ON unified_holidays(holiday_type);
CREATE INDEX IF NOT EXISTS idx_holidays_announced ON unified_holidays(is_announced);
CREATE INDEX IF NOT EXISTS idx_holidays_affects_seminars ON unified_holidays(affects_seminars);

CREATE INDEX IF NOT EXISTS idx_reschedule_history_holiday_id ON unified_seminar_reschedule_history(holiday_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_history_original_date ON unified_seminar_reschedule_history(original_date);
CREATE INDEX IF NOT EXISTS idx_reschedule_history_new_date ON unified_seminar_reschedule_history(new_date);
CREATE INDEX IF NOT EXISTS idx_reschedule_history_class_year ON unified_seminar_reschedule_history(class_year);

CREATE INDEX IF NOT EXISTS idx_impact_assessments_holiday_id ON unified_holiday_impact_assessments(holiday_id);
CREATE INDEX IF NOT EXISTS idx_impact_assessments_type ON unified_holiday_impact_assessments(impact_type);
CREATE INDEX IF NOT EXISTS idx_impact_assessments_severity ON unified_holiday_impact_assessments(impact_severity);

CREATE INDEX IF NOT EXISTS idx_academic_calendar_dates ON unified_academic_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_type ON unified_academic_calendar(event_type);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_class_year ON unified_academic_calendar(class_year);

CREATE INDEX IF NOT EXISTS idx_auto_reschedule_rules_type ON unified_auto_reschedule_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_auto_reschedule_rules_active ON unified_auto_reschedule_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_holiday_notifications_holiday_id ON unified_holiday_notifications(holiday_id);
CREATE INDEX IF NOT EXISTS idx_holiday_notifications_type ON unified_holiday_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_holiday_notifications_status ON unified_holiday_notifications(status);

-- 8. Enable RLS
ALTER TABLE unified_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_seminar_reschedule_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_holiday_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_auto_reschedule_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_holiday_notifications ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Admins have full access to all holiday management tables
CREATE POLICY "Admins have full access to holidays"
ON unified_holidays FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to reschedule history"
ON unified_seminar_reschedule_history FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to impact assessments"
ON unified_holiday_impact_assessments FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to academic calendar"
ON unified_academic_calendar FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to auto reschedule rules"
ON unified_auto_reschedule_rules FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to holiday notifications"
ON unified_holiday_notifications FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Students can view holidays and their impact
CREATE POLICY "Students can view holidays"
ON unified_holidays FOR SELECT
USING (true);

CREATE POLICY "Students can view reschedule history"
ON unified_seminar_reschedule_history FOR SELECT
USING (true);

CREATE POLICY "Students can view academic calendar"
ON unified_academic_calendar FOR SELECT
USING (true);

-- 10. Utility Functions

-- Function to check if a date is a holiday
CREATE OR REPLACE FUNCTION is_holiday(check_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    holiday_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO holiday_count
    FROM unified_holidays
    WHERE holiday_date = check_date;
    
    RETURN holiday_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get next working day (skipping holidays)
CREATE OR REPLACE FUNCTION get_next_working_day(start_date DATE, days_to_add INTEGER DEFAULT 1)
RETURNS DATE AS $$
DECLARE
    current_working_date DATE := start_date;
    added_days INTEGER := 0;
BEGIN
    WHILE added_days < days_to_add LOOP
        current_working_date := current_working_date + INTERVAL '1 day';
        
        -- Skip weekends (optional - uncomment if needed)
        -- IF EXTRACT(DOW FROM current_working_date) NOT IN (0, 6) THEN
        
        -- Skip holidays
        IF NOT is_holiday(current_working_date) THEN
            added_days := added_days + 1;
        END IF;
    END LOOP;
    
    RETURN current_working_date;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically reschedule seminars for a holiday
CREATE OR REPLACE FUNCTION auto_reschedule_seminars_for_holiday(p_holiday_id UUID)
RETURNS JSON AS $$
DECLARE
    holiday_record RECORD;
    reschedule_results JSON[];
    affected_count INTEGER := 0;
BEGIN
    -- Get holiday details
    SELECT * INTO holiday_record
    FROM unified_holidays
    WHERE id = p_holiday_id;
    
    IF holiday_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Holiday not found');
    END IF;
    
    -- Check if holiday affects seminars
    IF NOT holiday_record.affects_seminars THEN
        RETURN json_build_object('success', true, 'message', 'Holiday does not affect seminars', 'affected_count', 0);
    END IF;
    
    -- Get seminars scheduled on the holiday date
    -- Note: You'll need to adapt this based on your actual seminar booking table structure
    -- This is a placeholder for the actual logic
    
    RETURN json_build_object(
        'success', true,
        'holiday_name', holiday_record.holiday_name,
        'holiday_date', holiday_record.holiday_date,
        'affected_count', affected_count,
        'reschedule_results', reschedule_results
    );
END;
$$ LANGUAGE plpgsql;

-- Function to assess holiday impact
CREATE OR REPLACE FUNCTION assess_holiday_impact(p_holiday_id UUID)
RETURNS JSON AS $$
DECLARE
    holiday_record RECORD;
    seminar_count INTEGER := 0;
    assignment_count INTEGER := 0;
    exam_count INTEGER := 0;
    total_impact INTEGER := 0;
    impact_severity TEXT := 'low';
BEGIN
    -- Get holiday details
    SELECT * INTO holiday_record
    FROM unified_holidays
    WHERE id = p_holiday_id;
    
    IF holiday_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Holiday not found');
    END IF;
    
    -- Count affected seminars (placeholder - adapt to your actual table structure)
    -- SELECT COUNT(*) INTO seminar_count FROM your_seminar_table WHERE date = holiday_record.holiday_date;
    
    -- Count affected assignments (placeholder)
    -- SELECT COUNT(*) INTO assignment_count FROM your_assignment_table WHERE due_date = holiday_record.holiday_date;
    
    -- Count affected exams (placeholder)
    -- SELECT COUNT(*) INTO exam_count FROM your_exam_table WHERE exam_date = holiday_record.holiday_date;
    
    total_impact := seminar_count + assignment_count + exam_count;
    
    -- Determine impact severity
    IF total_impact = 0 THEN
        impact_severity := 'low';
    ELSIF total_impact <= 5 THEN
        impact_severity := 'medium';
    ELSIF total_impact <= 15 THEN
        impact_severity := 'high';
    ELSE
        impact_severity := 'critical';
    END IF;
    
    -- Create impact assessment record
    INSERT INTO unified_holiday_impact_assessments (
        holiday_id, impact_type, affected_count, impact_severity,
        affected_items, status, assessed_by, assessed_at
    ) VALUES (
        p_holiday_id, 'seminars', seminar_count, impact_severity,
        json_build_object('seminars', seminar_count, 'assignments', assignment_count, 'exams', exam_count),
        'assessed', 'system', NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'holiday_name', holiday_record.holiday_name,
        'total_impact', total_impact,
        'impact_severity', impact_severity,
        'breakdown', json_build_object(
            'seminars', seminar_count,
            'assignments', assignment_count,
            'exams', exam_count
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to send holiday notifications
CREATE OR REPLACE FUNCTION schedule_holiday_notifications(p_holiday_id UUID)
RETURNS JSON AS $$
DECLARE
    holiday_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Get holiday details
    SELECT * INTO holiday_record
    FROM unified_holidays
    WHERE id = p_holiday_id;
    
    IF holiday_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Holiday not found');
    END IF;
    
    -- Schedule holiday announcement notification
    INSERT INTO unified_holiday_notifications (
        holiday_id, notification_type, target_audience,
        notification_title, notification_body,
        notification_data, created_by
    ) VALUES (
        p_holiday_id, 'holiday_announcement', 'all_students',
        'Holiday Announcement: ' || holiday_record.holiday_name,
        'A holiday has been announced for ' || holiday_record.holiday_date::text || '. ' || 
        COALESCE(holiday_record.description, 'Please check for any schedule changes.'),
        json_build_object(
            'holiday_id', p_holiday_id,
            'holiday_name', holiday_record.holiday_name,
            'holiday_date', holiday_record.holiday_date,
            'holiday_type', holiday_record.holiday_type
        ),
        'system'
    );
    
    notification_count := notification_count + 1;
    
    -- If holiday affects seminars, schedule reschedule notifications
    IF holiday_record.affects_seminars THEN
        INSERT INTO unified_holiday_notifications (
            holiday_id, notification_type, target_audience,
            notification_title, notification_body,
            notification_data, created_by
        ) VALUES (
            p_holiday_id, 'seminar_reschedule', 'all_students',
            'Seminar Rescheduling Notice',
            'Due to the holiday on ' || holiday_record.holiday_date::text || 
            ', seminars scheduled for this date will be rescheduled. Please check your updated schedule.',
            json_build_object(
                'holiday_id', p_holiday_id,
                'affected_date', holiday_record.holiday_date,
                'notification_type', 'seminar_reschedule'
            ),
            'system'
        );
        
        notification_count := notification_count + 1;
    END IF;
    
    -- Mark holiday as notification scheduled
    UPDATE unified_holidays 
    SET notification_sent = true
    WHERE id = p_holiday_id;
    
    RETURN json_build_object(
        'success', true,
        'notifications_scheduled', notification_count,
        'holiday_name', holiday_record.holiday_name
    );
END;
$$ LANGUAGE plpgsql;

-- 11. Triggers for automatic processing

-- Trigger to automatically assess impact when a holiday is created
CREATE OR REPLACE FUNCTION trigger_holiday_impact_assessment()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule impact assessment (could be done asynchronously)
    PERFORM assess_holiday_impact(NEW.id);
    
    -- Schedule notifications if it's an unannounced holiday
    IF NOT NEW.is_announced THEN
        PERFORM schedule_holiday_notifications(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holiday_created_trigger
    AFTER INSERT ON unified_holidays
    FOR EACH ROW
    EXECUTE FUNCTION trigger_holiday_impact_assessment();

-- 12. Comments for documentation
COMMENT ON TABLE unified_holidays IS 'Manages all types of holidays including unannounced emergency holidays';
COMMENT ON TABLE unified_seminar_reschedule_history IS 'Tracks all seminar rescheduling due to holidays';
COMMENT ON TABLE unified_holiday_impact_assessments IS 'Assesses the impact of holidays on academic activities';
COMMENT ON TABLE unified_academic_calendar IS 'Master academic calendar for all events and schedules';
COMMENT ON TABLE unified_auto_reschedule_rules IS 'Rules for automatic rescheduling of events due to holidays';
COMMENT ON TABLE unified_holiday_notifications IS 'Manages notifications related to holidays and rescheduling';

COMMENT ON FUNCTION is_holiday IS 'Checks if a given date is a holiday';
COMMENT ON FUNCTION get_next_working_day IS 'Gets the next working day skipping holidays';
COMMENT ON FUNCTION auto_reschedule_seminars_for_holiday IS 'Automatically reschedules seminars affected by a holiday';
COMMENT ON FUNCTION assess_holiday_impact IS 'Assesses and records the impact of a holiday on academic activities';
COMMENT ON FUNCTION schedule_holiday_notifications IS 'Schedules notifications for holiday announcements and affected events';

-- 13. Insert sample auto-reschedule rules
INSERT INTO unified_auto_reschedule_rules (
    rule_name, rule_type, trigger_conditions, reschedule_logic, 
    priority, created_by, approved_by
) VALUES 
(
    'Emergency Holiday Seminar Reschedule',
    'seminar_reschedule',
    '{"holiday_types": ["emergency", "unannounced"], "min_notice_hours": 24}',
    '{"reschedule_days": 3, "prefer_same_weekday": true, "avoid_weekends": true, "check_conflicts": true}',
    1,
    'system',
    'admin'
),
(
    'Planned Holiday Seminar Reschedule', 
    'seminar_reschedule',
    '{"holiday_types": ["national", "regional", "announced"], "min_notice_days": 7}',
    '{"reschedule_days": 7, "prefer_next_available": true, "maintain_sequence": true}',
    2,
    'system', 
    'admin'
),
(
    'Assignment Extension for Holidays',
    'assignment_extension', 
    '{"holiday_types": ["emergency", "unannounced"], "affects_due_date": true}',
    '{"extension_days": 2, "max_extensions": 1, "notify_students": true}',
    3,
    'system',
    'admin'
);

-- 14. Insert sample academic calendar events
INSERT INTO unified_academic_calendar (
    event_name, event_type, start_date, end_date, 
    class_year, is_fixed, priority_level, created_by, approved_by
) VALUES 
(
    'Semester 1 Start',
    'semester_start',
    '2024-07-01',
    '2024-07-01',
    NULL,
    true,
    1,
    'admin',
    'principal'
),
(
    'Mid-Semester Exams',
    'exam_period', 
    '2024-09-15',
    '2024-09-25',
    NULL,
    true,
    1,
    'admin',
    'principal'
),
(
    'Seminar Week',
    'seminar_week',
    '2024-10-01', 
    '2024-10-07',
    NULL,
    false,
    2,
    'admin',
    'hod'
);