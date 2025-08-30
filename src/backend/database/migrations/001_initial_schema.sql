-- ================================================================
-- INITIAL DATABASE SCHEMA MIGRATION
-- Astral Core Mental Health Platform v2.0
-- Migration: 001_initial_schema
-- Date: 2025-08-30
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ================================
-- ENUM TYPES
-- ================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'therapist',
    'crisis_counselor',
    'peer_supporter',
    'user',
    'anonymous'
);

-- Crisis severity levels
CREATE TYPE crisis_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical',
    'emergency'
);

-- Assessment status
CREATE TYPE assessment_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'reviewed',
    'archived'
);

-- Appointment status
CREATE TYPE appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show'
);

-- Message status
CREATE TYPE message_status AS ENUM (
    'sent',
    'delivered',
    'read',
    'failed'
);

-- ================================
-- CORE TABLES
-- ================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role user_role DEFAULT 'user',
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(50),
    pronouns VARCHAR(50),
    
    -- Location
    country VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- Emergency contacts
    emergency_contacts JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_search ON users USING gin(
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, ''))
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ================================
-- CRISIS MANAGEMENT
-- ================================

-- Crisis alerts table
CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    severity crisis_severity NOT NULL,
    
    -- Detection details
    trigger_source VARCHAR(100), -- 'ai_detection', 'user_initiated', 'peer_report', etc.
    confidence_score DECIMAL(3,2),
    risk_factors JSONB DEFAULT '[]',
    warning_signs TEXT[],
    
    -- Response details
    response_initiated_at TIMESTAMPTZ,
    responder_id UUID REFERENCES users(id),
    response_type VARCHAR(100), -- '988_connected', '911_called', 'crisis_text', 'therapist_notified'
    response_notes TEXT,
    
    -- Outcome
    resolution_time_minutes INT,
    outcome VARCHAR(100),
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_completed_at TIMESTAMPTZ,
    
    -- Location (if consented)
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    location_accuracy INT,
    location_timestamp TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    
    -- Privacy
    is_anonymous BOOLEAN DEFAULT false,
    consent_988 BOOLEAN DEFAULT false,
    consent_911 BOOLEAN DEFAULT false,
    consent_location BOOLEAN DEFAULT false
);

CREATE INDEX idx_crisis_alerts_user_id ON crisis_alerts(user_id);
CREATE INDEX idx_crisis_alerts_severity ON crisis_alerts(severity);
CREATE INDEX idx_crisis_alerts_created_at ON crisis_alerts(created_at DESC);
CREATE INDEX idx_crisis_alerts_unresolved ON crisis_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Safety plans table
CREATE TABLE safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan details
    warning_signs TEXT[],
    coping_strategies TEXT[],
    support_contacts JSONB DEFAULT '[]',
    safe_environments TEXT[],
    professional_contacts JSONB DEFAULT '[]',
    crisis_resources JSONB DEFAULT '[]',
    reasons_for_living TEXT[],
    
    -- Activation
    is_active BOOLEAN DEFAULT true,
    last_reviewed_at TIMESTAMPTZ,
    last_activated_at TIMESTAMPTZ,
    activation_count INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_safety_plans_user_id ON safety_plans(user_id);
CREATE INDEX idx_safety_plans_active ON safety_plans(is_active) WHERE is_active = true;

-- ================================
-- MENTAL HEALTH TRACKING
-- ================================

-- Mood entries table
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Mood data
    mood_score INT CHECK (mood_score >= 1 AND mood_score <= 10),
    emotions TEXT[],
    energy_level INT CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INT CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
    stress_level INT CHECK (stress_level >= 0 AND stress_level <= 10),
    
    -- Context
    activities TEXT[],
    triggers TEXT[],
    notes TEXT,
    location VARCHAR(200),
    weather VARCHAR(50),
    sleep_hours DECIMAL(3,1),
    medication_taken BOOLEAN,
    
    -- Metadata
    entry_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date DESC);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);

-- Journal entries table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Entry content
    title VARCHAR(500),
    content TEXT NOT NULL,
    encrypted_content TEXT, -- For sensitive content
    
    -- Analysis
    sentiment_score DECIMAL(3,2),
    emotions JSONB DEFAULT '{}',
    topics TEXT[],
    risk_indicators TEXT[],
    
    -- Prompts
    prompt_id UUID,
    prompt_text TEXT,
    
    -- Privacy
    is_private BOOLEAN DEFAULT true,
    shared_with UUID[], -- Array of user IDs
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_search ON journal_entries USING gin(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
) WHERE deleted_at IS NULL;

-- ================================
-- ASSESSMENTS
-- ================================

-- Assessment templates table
CREATE TABLE assessment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'PHQ-9', 'GAD-7', etc.
    description TEXT,
    category VARCHAR(100),
    questions JSONB NOT NULL,
    scoring_algorithm JSONB,
    interpretation_guide JSONB,
    min_score INT,
    max_score INT,
    completion_time_minutes INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_templates_code ON assessment_templates(code);
CREATE INDEX idx_assessment_templates_active ON assessment_templates(is_active);

-- User assessments table
CREATE TABLE user_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES assessment_templates(id),
    
    -- Assessment data
    responses JSONB NOT NULL,
    score INT,
    severity_level VARCHAR(50),
    risk_level VARCHAR(50),
    
    -- Status
    status assessment_status DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_seconds INT,
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    recommendations JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_template_id ON user_assessments(template_id);
CREATE INDEX idx_user_assessments_status ON user_assessments(status);
CREATE INDEX idx_user_assessments_created_at ON user_assessments(created_at DESC);

-- ================================
-- THERAPY & APPOINTMENTS
-- ================================

-- Therapist profiles table
CREATE TABLE therapist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional info
    license_number VARCHAR(100),
    license_state VARCHAR(50),
    license_expiry DATE,
    specializations TEXT[],
    treatment_approaches TEXT[],
    languages TEXT[],
    years_experience INT,
    
    -- Availability
    availability_schedule JSONB DEFAULT '{}',
    accepting_new_clients BOOLEAN DEFAULT true,
    online_therapy_available BOOLEAN DEFAULT true,
    in_person_available BOOLEAN DEFAULT false,
    
    -- Rates
    hourly_rate DECIMAL(10,2),
    sliding_scale_available BOOLEAN DEFAULT false,
    insurance_accepted TEXT[],
    
    -- Profile
    bio TEXT,
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX idx_therapist_profiles_accepting ON therapist_profiles(accepting_new_clients) WHERE accepting_new_clients = true;
CREATE INDEX idx_therapist_profiles_specializations ON therapist_profiles USING gin(specializations);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 50,
    status appointment_status DEFAULT 'scheduled',
    
    -- Type
    appointment_type VARCHAR(100), -- 'initial_consultation', 'therapy_session', 'crisis_intervention'
    is_online BOOLEAN DEFAULT true,
    meeting_link TEXT,
    location_address TEXT,
    
    -- Notes
    client_notes TEXT,
    therapist_notes TEXT,
    session_summary TEXT,
    
    -- Reminders
    reminder_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    
    -- Billing
    fee DECIMAL(10,2),
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ================================
-- MESSAGING & COMMUNICATION
-- ================================

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'direct', 'group', 'support', 'crisis'
    name VARCHAR(200),
    participants UUID[],
    is_encrypted BOOLEAN DEFAULT true,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_participants ON conversations USING gin(participants);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC) WHERE deleted_at IS NULL;

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Content
    content TEXT,
    encrypted_content TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Status
    status message_status DEFAULT 'sent',
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    
    -- Crisis detection
    risk_score DECIMAL(3,2),
    flagged_for_review BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_flagged ON messages(flagged_for_review) WHERE flagged_for_review = true;

-- ================================
-- RESOURCES & CONTENT
-- ================================

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    type VARCHAR(100), -- 'article', 'video', 'audio', 'worksheet', 'guide'
    category VARCHAR(100),
    tags TEXT[],
    
    -- Media
    thumbnail_url TEXT,
    media_url TEXT,
    duration_minutes INT,
    
    -- Metadata
    author VARCHAR(200),
    source VARCHAR(200),
    external_url TEXT,
    
    -- Engagement
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    average_rating DECIMAL(2,1),
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_tags ON resources USING gin(tags);
CREATE INDEX idx_resources_published ON resources(is_published, published_at DESC);
CREATE INDEX idx_resources_search ON resources USING gin(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, ''))
);

-- ================================
-- AUDIT & COMPLIANCE
-- ================================

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ================================
-- FUNCTIONS & TRIGGERS
-- ================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crisis_alerts_updated_at BEFORE UPDATE ON crisis_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON assessment_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_assessments_updated_at BEFORE UPDATE ON user_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON therapist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================
-- PERMISSIONS & ROW LEVEL SECURITY
-- ================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies (examples - adjust based on requirements)
CREATE POLICY users_self_view ON users
    FOR SELECT USING (id = current_setting('app.current_user_id')::UUID OR 
                      'admin' = current_setting('app.current_user_role'));

CREATE POLICY users_self_update ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id')::UUID);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Composite indexes for common queries
CREATE INDEX idx_crisis_alerts_user_severity ON crisis_alerts(user_id, severity, created_at DESC);
CREATE INDEX idx_mood_entries_user_date_score ON mood_entries(user_id, entry_date DESC, mood_score);
CREATE INDEX idx_appointments_date_status ON appointments(scheduled_at, status) WHERE status IN ('scheduled', 'confirmed');

-- ================================
-- END OF INITIAL SCHEMA MIGRATION
-- ================================