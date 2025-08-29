-- AstralCore V4 Performance Optimization Migration
-- Migration: 003_performance_indexes
-- Created: 2025-01-xx
-- Description: Add performance indexes and optimizations for high-traffic queries

BEGIN;

-- Additional performance indexes for crisis management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crisis_events_severity_created 
ON crisis_events(severity, created_at DESC) 
WHERE resolved = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crisis_events_user_severity 
ON crisis_events(user_id, severity, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crisis_events_confidence 
ON crisis_events(confidence_score DESC, created_at DESC) 
WHERE confidence_score > 0.7;

-- Chat message performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_ai_crisis 
ON chat_messages(is_ai_message, crisis_confidence_score DESC, created_at DESC) 
WHERE crisis_confidence_score > 0.5;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation_created 
ON chat_messages(conversation_id, created_at ASC);

-- Mood entries performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_entries_user_recent 
ON mood_entries(user_id, created_at DESC) 
WHERE created_at >= NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_entries_low_scores 
ON mood_entries(user_id, mood_score, created_at DESC) 
WHERE mood_score <= 4;

-- Safety plans performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safety_plans_active_updated 
ON safety_plans(user_id, updated_at DESC) 
WHERE is_active = true;

-- Emergency contacts performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emergency_contacts_crisis_priority 
ON emergency_contacts(user_id, crisis_only, priority_order) 
WHERE is_active = true;

-- Analytics performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_feature_date 
ON user_analytics(feature_used, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_crisis_prevention 
ON user_analytics(user_id, date DESC) 
WHERE crisis_prevented_count > 0;

-- Notification logs performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_type_status 
ON notification_logs(notification_type, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_unread 
ON notification_logs(user_id, created_at DESC) 
WHERE opened = false;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crisis_events_composite 
ON crisis_events(user_id, severity, resolved, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_entries_composite 
ON mood_entries(user_id, date DESC, mood_score);

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_helpers 
ON users(role, last_seen DESC) 
WHERE is_active = true AND role IN ('helper', 'therapist');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_helper_profiles_available 
ON helper_profiles(available_for_crisis, verified, updated_at DESC) 
WHERE available_for_crisis = true AND verified = true;

-- Text search indexes for crisis keywords
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crisis_events_keywords_gin 
ON crisis_events USING gin(detected_keywords) 
WHERE detected_keywords IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_keywords_gin 
ON chat_messages USING gin(crisis_keywords_detected) 
WHERE crisis_keywords_detected IS NOT NULL;

-- Create materialized view for crisis statistics (for dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS crisis_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    severity,
    COUNT(*) as event_count,
    AVG(confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
    AVG(response_time_seconds) as avg_response_time
FROM crisis_events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), severity
ORDER BY date DESC, severity;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_crisis_statistics_date_severity 
ON crisis_statistics(date, severity);

-- Create materialized view for user wellness trends
CREATE MATERIALIZED VIEW IF NOT EXISTS user_wellness_trends AS
SELECT 
    user_id,
    DATE_TRUNC('week', created_at) as week,
    AVG(mood_score) as avg_mood,
    COUNT(*) as entries_count,
    AVG(energy_level) as avg_energy,
    AVG(anxiety_level) as avg_anxiety,
    AVG(sleep_quality) as avg_sleep
FROM mood_entries
WHERE created_at >= NOW() - INTERVAL '180 days'
GROUP BY user_id, DATE_TRUNC('week', created_at)
ORDER BY user_id, week DESC;

-- Create unique index on wellness trends view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wellness_trends_user_week 
ON user_wellness_trends(user_id, week);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY crisis_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_wellness_trends;
END;
$$ LANGUAGE plpgsql;

-- Create optimized function for getting user crisis risk
CREATE OR REPLACE FUNCTION get_user_crisis_risk(user_uuid UUID)
RETURNS TABLE(
    risk_level TEXT,
    confidence DECIMAL,
    factors TEXT[]
) AS $$
DECLARE
    recent_mood_avg DECIMAL;
    crisis_count INTEGER;
    last_crisis_days INTEGER;
    risk TEXT := 'low';
    conf DECIMAL := 0.0;
    risk_factors TEXT[] := '{}';
BEGIN
    -- Get recent mood average (last 7 days)
    SELECT AVG(mood_score) INTO recent_mood_avg
    FROM mood_entries
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Count crisis events in last 30 days
    SELECT COUNT(*) INTO crisis_count
    FROM crisis_events
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Days since last crisis
    SELECT EXTRACT(DAYS FROM NOW() - MAX(created_at)) INTO last_crisis_days
    FROM crisis_events
    WHERE user_id = user_uuid;
    
    -- Assess risk factors
    IF recent_mood_avg IS NOT NULL AND recent_mood_avg <= 3 THEN
        risk_factors := array_append(risk_factors, 'low_mood_pattern');
        conf := conf + 0.3;
    END IF;
    
    IF crisis_count >= 3 THEN
        risk_factors := array_append(risk_factors, 'frequent_crises');
        conf := conf + 0.4;
    ELSIF crisis_count >= 1 THEN
        risk_factors := array_append(risk_factors, 'recent_crisis');
        conf := conf + 0.2;
    END IF;
    
    IF last_crisis_days IS NOT NULL AND last_crisis_days <= 7 THEN
        risk_factors := array_append(risk_factors, 'very_recent_crisis');
        conf := conf + 0.3;
    END IF;
    
    -- Determine risk level
    IF conf >= 0.7 THEN
        risk := 'high';
    ELSIF conf >= 0.4 THEN
        risk := 'medium';
    END IF;
    
    RETURN QUERY SELECT risk, LEAST(1.0, conf), risk_factors;
END;
$$ LANGUAGE plpgsql;

-- Create function for efficient crisis keyword detection
CREATE OR REPLACE FUNCTION detect_crisis_keywords_fast(content TEXT)
RETURNS TABLE(keywords TEXT[], confidence DECIMAL) AS $$
DECLARE
    matched_keywords TEXT[] := '{}';
    total_weight DECIMAL := 0.0;
    confidence_score DECIMAL := 0.0;
    content_lower TEXT;
    keyword_record RECORD;
BEGIN
    content_lower := lower(content);
    
    -- Use the crisis keywords configuration for fast lookup
    FOR keyword_record IN 
        SELECT keyword, weight
        FROM crisis_keywords_config 
        WHERE is_active = true 
        AND position(keyword IN content_lower) > 0
        ORDER BY weight DESC
    LOOP
        matched_keywords := array_append(matched_keywords, keyword_record.keyword);
        total_weight := total_weight + keyword_record.weight;
    END LOOP;
    
    -- Calculate confidence (normalized)
    IF total_weight > 0 THEN
        confidence_score := LEAST(1.0, total_weight / 5.0); -- Normalize to max of 5 points
        
        -- Apply context adjustments
        IF position('not ' IN content_lower) > 0 THEN
            confidence_score := confidence_score * 0.7;
        END IF;
        
        IF array_length(matched_keywords, 1) >= 2 THEN
            confidence_score := LEAST(1.0, confidence_score * 1.2);
        END IF;
    END IF;
    
    RETURN QUERY SELECT matched_keywords, confidence_score;
END;
$$ LANGUAGE plpgsql;

-- Update the original function to use the fast version
DROP FUNCTION IF EXISTS detect_crisis_keywords(TEXT);
CREATE OR REPLACE FUNCTION detect_crisis_keywords(content TEXT)
RETURNS TABLE(keywords TEXT[], confidence DECIMAL) AS $$
BEGIN
    RETURN QUERY SELECT * FROM detect_crisis_keywords_fast(content);
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Record migration completion
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('003', NOW(), 'Add performance indexes and optimization queries')
ON CONFLICT (version) DO NOTHING;