-- =====================================================================
-- Migration: 001_initial_setup
-- Description: Initial database schema for AstralCore Mental Health Platform
-- Date: 2025-08-30
-- =====================================================================

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if migration has already been executed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_setup') THEN
        RAISE NOTICE 'Migration 001_initial_setup already executed, skipping...';
        RETURN;
    END IF;
END
$$;

-- Begin migration
BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================================
-- CORE TABLES
-- =====================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT CHECK (role IN ('admin', 'therapist', 'psychiatrist', 'helper', 'user', 'moderator')) DEFAULT 'user',
    auth_provider TEXT CHECK (auth_provider IN ('email', 'google', 'apple', 'anonymous')) DEFAULT 'email',
    auth_provider_id TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'suspended', 'deactivated', 'banned')) DEFAULT 'active',
    suspension_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender TEXT,
    pronouns TEXT,
    country TEXT,
    state_province TEXT,
    city TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    mental_health_goals TEXT[],
    conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    crisis_keywords TEXT[],
    preferred_intervention_style TEXT,
    therapy_preferences JSONB,
    privacy_level TEXT CHECK (privacy_level IN ('private', 'friends', 'community', 'public')) DEFAULT 'private',
    show_mood_publicly BOOLEAN DEFAULT false,
    allow_peer_support BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT CHECK (theme IN ('light', 'dark', 'auto', 'high-contrast')) DEFAULT 'auto',
    color_scheme TEXT DEFAULT 'default',
    font_size TEXT CHECK (font_size IN ('small', 'medium', 'large', 'xl')) DEFAULT 'medium',
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader_mode BOOLEAN DEFAULT false,
    notifications_enabled BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    crisis_alerts BOOLEAN DEFAULT true,
    mood_reminders BOOLEAN DEFAULT true,
    medication_reminders BOOLEAN DEFAULT false,
    appointment_reminders BOOLEAN DEFAULT true,
    daily_check_ins BOOLEAN DEFAULT false,
    weekly_summaries BOOLEAN DEFAULT true,
    panic_button_enabled BOOLEAN DEFAULT true,
    quick_exit_enabled BOOLEAN DEFAULT true,
    auto_crisis_detection BOOLEAN DEFAULT true,
    crisis_contact_auto_notify BOOLEAN DEFAULT false,
    data_collection_consent BOOLEAN DEFAULT true,
    analytics_consent BOOLEAN DEFAULT true,
    research_participation BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    csrf_token TEXT,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- MENTAL HEALTH TABLES
-- =====================================================================

-- Mood entries
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10) NOT NULL,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_hours DECIMAL(3,1),
    emotions TEXT[],
    primary_emotion TEXT,
    triggers TEXT[],
    activities TEXT[],
    social_interaction TEXT CHECK (social_interaction IN ('none', 'minimal', 'moderate', 'high')),
    location TEXT CHECK (location IN ('home', 'work', 'school', 'outdoors', 'other')),
    weather TEXT,
    medication_taken BOOLEAN DEFAULT false,
    exercise_minutes INTEGER,
    water_intake INTEGER,
    caffeine_intake INTEGER,
    alcohol_units INTEGER,
    notes TEXT,
    gratitude TEXT[],
    accomplishments TEXT[],
    sentiment_score DECIMAL(3,2),
    crisis_indicators TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('free_write', 'guided', 'gratitude', 'reflection', 'goal_setting')),
    prompt_id UUID,
    word_count INTEGER,
    writing_time_seconds INTEGER,
    mood_before INTEGER,
    mood_after INTEGER,
    sentiment_score DECIMAL(3,2),
    key_themes TEXT[],
    emotions_detected TEXT[],
    crisis_keywords_found TEXT[],
    is_private BOOLEAN DEFAULT true,
    shared_with_therapist BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety plans
CREATE TABLE safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    warning_signs TEXT[],
    triggers TEXT[],
    internal_coping TEXT[],
    social_distractions TEXT[],
    social_support TEXT[],
    professional_contacts JSONB,
    crisis_contacts JSONB,
    environment_safety TEXT[],
    reasons_to_live TEXT[],
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    effectiveness_rating INTEGER,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    therapist_approved BOOLEAN DEFAULT false,
    therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- CRISIS MANAGEMENT TABLES
-- =====================================================================

-- Crisis events
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('keyword', 'sentiment', 'behavioral', 'manual', 'ai_detected', 'panic_button')),
    trigger_source TEXT,
    detected_keywords TEXT[],
    sentiment_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    false_positive BOOLEAN DEFAULT false,
    intervention_type TEXT[],
    interventions_offered JSONB,
    interventions_accepted JSONB,
    response_time_seconds INTEGER,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method TEXT,
    escalated BOOLEAN DEFAULT false,
    emergency_services_contacted BOOLEAN DEFAULT false,
    followup_required BOOLEAN DEFAULT false,
    followup_completed BOOLEAN DEFAULT false,
    location_context JSONB,
    device_context JSONB,
    preceding_mood_scores INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis logs
CREATE TABLE crisis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    log_type TEXT CHECK (log_type IN ('detection', 'intervention', 'escalation', 'resolution', 'followup')),
    message TEXT,
    severity TEXT,
    action TEXT,
    action_by TEXT,
    action_result TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    phone_primary TEXT,
    phone_secondary TEXT,
    email TEXT,
    address TEXT,
    contact_method TEXT CHECK (contact_method IN ('phone', 'text', 'email', 'all')) DEFAULT 'phone',
    language TEXT DEFAULT 'en',
    available_24_7 BOOLEAN DEFAULT false,
    availability_schedule JSONB,
    timezone TEXT,
    can_contact_for_crisis BOOLEAN DEFAULT true,
    can_share_location BOOLEAN DEFAULT false,
    can_share_mood_data BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis interventions
CREATE TABLE crisis_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('breathing', 'grounding', 'distraction', 'social', 'physical', 'creative', 'professional')),
    category TEXT,
    description TEXT,
    instructions JSONB,
    duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    effectiveness_rating DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2),
    suitable_for_severity TEXT[],
    contraindications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- AI & ANALYTICS TABLES
-- =====================================================================

-- AI conversations
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    conversation_type TEXT CHECK (conversation_type IN ('therapy', 'crisis', 'general', 'assessment')),
    is_active BOOLEAN DEFAULT true,
    model_name TEXT,
    model_version TEXT,
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    sentiment_score DECIMAL(3,2),
    emotion_scores JSONB,
    crisis_indicators JSONB,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    page_views INTEGER DEFAULT 0,
    session_duration_seconds INTEGER,
    feature_used TEXT,
    feature_duration_seconds INTEGER,
    actions_taken TEXT[],
    goals_completed TEXT[],
    device_type TEXT,
    browser TEXT,
    os TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_level TEXT CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
    category TEXT,
    message TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id UUID,
    error_code TEXT,
    stack_trace TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Profile indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Mood indexes
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_mood_entries_mood_score ON mood_entries(mood_score);

-- Journal indexes
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);

-- Crisis indexes
CREATE INDEX idx_crisis_events_user_id ON crisis_events(user_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at);
CREATE INDEX idx_crisis_events_resolved ON crisis_events(resolved);

-- AI conversation indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);
CREATE INDEX idx_user_analytics_feature_used ON user_analytics(feature_used);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crisis_interventions_updated_at BEFORE UPDATE ON crisis_interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY user_profiles_own_data ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_preferences_own_data ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY mood_entries_own_data ON mood_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY journal_entries_own_data ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY safety_plans_own_data ON safety_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY crisis_events_own_data ON crisis_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY emergency_contacts_own_data ON emergency_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ai_conversations_own_data ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY ai_messages_own_data ON ai_messages FOR ALL USING (auth.uid() = user_id);

-- Record migration completion
INSERT INTO schema_migrations (version) VALUES ('001_initial_setup');

COMMIT;

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_initial_setup completed successfully';
END
$$;