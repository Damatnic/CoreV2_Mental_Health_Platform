-- AstralCore V4 Initial Database Schema Migration
-- Migration: 001_initial_schema
-- Created: 2025-01-xx
-- Description: Creates all initial tables, indexes, and security policies for the mental health platform

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'helper', 'therapist', 'admin');
CREATE TYPE crisis_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE trigger_type AS ENUM ('keyword', 'behavioral', 'manual', 'ai_detected', 'panic_button');
CREATE TYPE escalation_step AS ENUM ('ai_response', 'breathing_exercise', 'safety_plan', 'peer_support', 'crisis_counselor', 'emergency_services');
CREATE TYPE notification_type AS ENUM ('crisis_alert', 'mood_reminder', 'check_in', 'peer_message', 'system');
CREATE TYPE delivery_method AS ENUM ('push', 'email', 'in_app');
CREATE TYPE contact_method AS ENUM ('phone', 'text', 'email');

-- ============================================================================
-- USERS AND AUTHENTICATION TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles for additional information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    preferred_intervention_style VARCHAR(20) DEFAULT 'gentle', -- gentle, direct, clinical, peer
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    accessibility_needs JSONB,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    privacy_level INTEGER NOT NULL DEFAULT 1, -- 1-5 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Helper profiles (therapists, peer supporters)
CREATE TABLE helper_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specializations TEXT[],
    license_number VARCHAR(50),
    available_for_crisis BOOLEAN NOT NULL DEFAULT false,
    max_clients INTEGER DEFAULT 50,
    bio TEXT,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- MOOD TRACKING TABLES
-- ============================================================================

-- Mood entries for daily tracking
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    triggers TEXT[],
    activities TEXT[],
    notes TEXT,
    weather VARCHAR(20),
    social_interaction BOOLEAN,
    exercise BOOLEAN,
    medication_taken BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================================================
-- CRISIS MANAGEMENT TABLES
-- ============================================================================

-- Crisis events for tracking emergencies
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    severity crisis_severity NOT NULL,
    trigger_type trigger_type,
    detected_keywords TEXT[],
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    location_context JSONB,
    device_context JSONB,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_method VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis escalation logs
CREATE TABLE crisis_escalation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crisis_event_id UUID NOT NULL REFERENCES crisis_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    escalation_step escalation_step NOT NULL,
    escalation_trigger VARCHAR(100),
    automated BOOLEAN NOT NULL DEFAULT false,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SAFETY PLANNING TABLES
-- ============================================================================

-- Safety plans for crisis management
CREATE TABLE safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    warning_signs TEXT[],
    coping_strategies TEXT[],
    social_supports TEXT[], -- Encrypted on client side
    environmental_safety JSONB,
    professional_contacts JSONB, -- Encrypted on client side
    crisis_contacts JSONB, -- Encrypted on client side
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    safety_plan_id UUID REFERENCES safety_plans(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone_number TEXT, -- Encrypted on client side
    email TEXT, -- Encrypted on client side
    contact_method contact_method NOT NULL DEFAULT 'phone',
    crisis_only BOOLEAN NOT NULL DEFAULT false,
    priority_order INTEGER NOT NULL DEFAULT 1,
    availability_schedule JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- Chat messages for AI and peer support
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id VARCHAR(100) NOT NULL,
    message_content TEXT NOT NULL,
    is_ai_message BOOLEAN NOT NULL DEFAULT false,
    ai_model VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    crisis_keywords_detected TEXT[],
    crisis_confidence_score DECIMAL(3,2),
    intervention_triggered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND LOGGING TABLES
-- ============================================================================

-- User analytics for platform insights
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    feature_used VARCHAR(50) NOT NULL,
    session_duration INTEGER, -- in seconds
    interaction_count INTEGER DEFAULT 0,
    crisis_prevented_count INTEGER DEFAULT 0,
    safety_plan_accessed_count INTEGER DEFAULT 0,
    breathing_exercises_used INTEGER DEFAULT 0,
    page_load_time INTEGER, -- in milliseconds
    ai_response_time INTEGER, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    delivery_method delivery_method NOT NULL,
    title VARCHAR(200),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    opened BOOLEAN NOT NULL DEFAULT false,
    action_taken BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_seen ON users(last_seen);

-- Mood entries indexes
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date DESC);
CREATE INDEX idx_mood_entries_date ON mood_entries(date DESC);
CREATE INDEX idx_mood_entries_score ON mood_entries(mood_score) WHERE mood_score <= 3;

-- Crisis events indexes
CREATE INDEX idx_crisis_events_user ON crisis_events(user_id, created_at DESC);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity, created_at DESC);
CREATE INDEX idx_crisis_events_unresolved ON crisis_events(resolved, created_at DESC) WHERE resolved = false;
CREATE INDEX idx_crisis_events_keywords ON crisis_events USING gin(detected_keywords);

-- Safety plans indexes
CREATE INDEX idx_safety_plans_user_active ON safety_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id, priority_order);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_crisis ON chat_messages(crisis_confidence_score) WHERE crisis_confidence_score > 0.5;

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_date ON user_analytics(user_id, date DESC);
CREATE INDEX idx_user_analytics_feature ON user_analytics(feature_used, date DESC);

-- Notification logs indexes
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Helpers can view client profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('therapist', 'helper', 'admin'))
);

-- Mood entries policies
CREATE POLICY "Users can manage own mood entries" ON mood_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Helpers can view client mood entries" ON mood_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('therapist', 'helper', 'admin'))
);

-- Crisis events policies
CREATE POLICY "Users can view own crisis events" ON crisis_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own crisis events" ON crisis_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Helpers can manage crisis events" ON crisis_events FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('therapist', 'helper', 'admin'))
);

-- Safety plans policies
CREATE POLICY "Users can manage own safety plans" ON safety_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Helpers can view safety plans" ON safety_plans FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('therapist', 'helper'))
);

-- Emergency contacts policies
CREATE POLICY "Users can manage own emergency contacts" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Helpers can view crisis-related chats" ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('therapist', 'helper', 'admin'))
    AND crisis_confidence_score > 0.5
);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all analytics" ON user_analytics FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notification_logs FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STORED FUNCTIONS AND PROCEDURES
-- ============================================================================

-- Function to detect crisis keywords
CREATE OR REPLACE FUNCTION detect_crisis_keywords(content TEXT)
RETURNS TABLE(keywords TEXT[], confidence DECIMAL) AS $$
DECLARE
    crisis_keywords TEXT[] := ARRAY[
        'suicide', 'kill myself', 'want to die', 'end it all', 'no point living',
        'better off dead', 'can''t go on', 'worthless', 'hopeless', 'overdose',
        'self harm', 'cut myself', 'hurt myself', 'jump', 'bridge'
    ];
    keyword TEXT;
    matched_keywords TEXT[] := '{}';
    keyword_count INTEGER := 0;
    total_keywords INTEGER := array_length(crisis_keywords, 1);
    confidence_score DECIMAL := 0.0;
BEGIN
    -- Convert content to lowercase for matching
    content := lower(content);
    
    -- Check each crisis keyword
    FOREACH keyword IN ARRAY crisis_keywords LOOP
        IF position(keyword IN content) > 0 THEN
            matched_keywords := array_append(matched_keywords, keyword);
            keyword_count := keyword_count + 1;
        END IF;
    END LOOP;
    
    -- Calculate confidence based on keyword matches and context
    IF keyword_count > 0 THEN
        confidence_score := LEAST(1.0, (keyword_count::DECIMAL / total_keywords::DECIMAL) * 2);
        
        -- Boost confidence for multiple matches
        IF keyword_count >= 3 THEN
            confidence_score := LEAST(1.0, confidence_score * 1.5);
        END IF;
        
        -- Reduce confidence for negation words
        IF position('not ' IN content) > 0 OR position('don''t ' IN content) > 0 THEN
            confidence_score := confidence_score * 0.7;
        END IF;
    END IF;
    
    RETURN QUERY SELECT matched_keywords, confidence_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get mood trends
CREATE OR REPLACE FUNCTION get_mood_trend(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE(avg_mood DECIMAL, trend_direction TEXT, crisis_risk TEXT) AS $$
DECLARE
    recent_avg DECIMAL;
    older_avg DECIMAL;
    trend TEXT := 'stable';
    risk TEXT := 'low';
BEGIN
    -- Calculate recent average (last 7 days)
    SELECT AVG(mood_score) INTO recent_avg
    FROM mood_entries
    WHERE user_id = user_uuid
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Calculate older average (8-14 days ago)
    SELECT AVG(mood_score) INTO older_avg
    FROM mood_entries
    WHERE user_id = user_uuid
    AND created_at >= NOW() - INTERVAL '14 days'
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Determine trend direction
    IF recent_avg IS NOT NULL AND older_avg IS NOT NULL THEN
        IF recent_avg > older_avg + 0.5 THEN
            trend := 'improving';
        ELSIF recent_avg < older_avg - 0.5 THEN
            trend := 'declining';
        END IF;
    END IF;
    
    -- Determine crisis risk
    IF recent_avg <= 3 THEN
        risk := 'high';
    ELSIF recent_avg <= 5 THEN
        risk := 'medium';
    END IF;
    
    RETURN QUERY SELECT COALESCE(recent_avg, 0), trend, risk;
END;
$$ LANGUAGE plpgsql;

-- Function to update user last_seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_seen = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update last_seen when user creates content
CREATE TRIGGER trigger_update_last_seen_mood
    AFTER INSERT ON mood_entries
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER trigger_update_last_seen_crisis
    AFTER INSERT ON crisis_events
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER trigger_update_last_seen_chat
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- Update timestamps on record updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_helper_profiles_updated_at BEFORE UPDATE ON helper_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crisis_events_updated_at BEFORE UPDATE ON crisis_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Record migration completion
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('001', NOW())
ON CONFLICT (version) DO NOTHING;