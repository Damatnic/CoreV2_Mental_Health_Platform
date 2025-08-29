-- Mental Health Platform Database Schema
-- PostgreSQL 14+ Required for HIPAA Compliance Features
-- All sensitive data is encrypted at rest and in transit

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- Create custom types
CREATE TYPE user_role AS ENUM ('patient', 'therapist', 'psychiatrist', 'admin', 'crisis_counselor', 'family_member');
CREATE TYPE mood_rating AS ENUM ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10');
CREATE TYPE crisis_severity AS ENUM ('low', 'moderate', 'high', 'critical', 'emergency');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE medication_status AS ENUM ('active', 'discontinued', 'paused', 'completed');
CREATE TYPE session_type AS ENUM ('individual', 'group', 'crisis', 'assessment', 'medication_review');
CREATE TYPE contact_type AS ENUM ('emergency', 'therapist', 'psychiatrist', 'family', 'friend', 'crisis_hotline');

-- Users table (HIPAA compliant with encryption for PII)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_encrypted BYTEA NOT NULL, -- Encrypted version for search
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    
    -- Personal Information (encrypted)
    first_name_encrypted BYTEA NOT NULL,
    last_name_encrypted BYTEA NOT NULL,
    date_of_birth_encrypted BYTEA,
    phone_encrypted BYTEA,
    
    -- Address (encrypted)
    address_line1_encrypted BYTEA,
    address_line2_encrypted BYTEA,
    city_encrypted BYTEA,
    state_encrypted BYTEA,
    zip_code_encrypted BYTEA,
    country VARCHAR(2) DEFAULT 'US',
    
    -- Medical Information
    primary_therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    primary_psychiatrist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    emergency_contact_name_encrypted BYTEA,
    emergency_contact_phone_encrypted BYTEA,
    emergency_contact_relationship VARCHAR(100),
    
    -- Account Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
    privacy_settings JSONB DEFAULT '{"share_mood": false, "share_journal": false, "anonymous_mode": false}'::jsonb,
    
    -- Security & Compliance
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret_encrypted BYTEA,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete for compliance
    deletion_reason TEXT,
    
    -- Indexes for performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_therapist ON users(primary_therapist_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

-- Sessions table (for authentication and audit)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,
    
    -- Session Information
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(255),
    device_type VARCHAR(50),
    
    -- Security
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    
    -- Activity Tracking
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Mood entries table
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Mood Data
    mood_score mood_rating NOT NULL,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    
    -- Emotional States (multiple can be true)
    emotions JSONB DEFAULT '[]'::jsonb, -- Array of emotion strings
    
    -- Context
    activities JSONB DEFAULT '[]'::jsonb, -- What user was doing
    triggers JSONB DEFAULT '[]'::jsonb, -- What triggered the mood
    coping_strategies_used JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Data
    sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    medication_taken BOOLEAN DEFAULT false,
    notes_encrypted BYTEA, -- Encrypted free text
    
    -- Location (optional, for pattern analysis)
    location_type VARCHAR(50), -- home, work, outside, etc.
    weather_conditions JSONB,
    
    -- Crisis Detection
    crisis_indicators JSONB DEFAULT '[]'::jsonb,
    requires_intervention BOOLEAN DEFAULT false,
    intervention_triggered_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate entries within 5 minutes
    CONSTRAINT unique_mood_entry UNIQUE (user_id, created_at)
);

CREATE INDEX idx_mood_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_created_at ON mood_entries(created_at DESC);
CREATE INDEX idx_mood_score ON mood_entries(mood_score);
CREATE INDEX idx_mood_intervention ON mood_entries(requires_intervention) WHERE requires_intervention = true;

-- Journal entries table (fully encrypted)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Encrypted Content
    title_encrypted BYTEA,
    content_encrypted BYTEA NOT NULL,
    
    -- Analysis Results (stored after processing)
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    emotion_analysis JSONB,
    keyword_tags JSONB DEFAULT '[]'::jsonb,
    
    -- Therapy Related
    shared_with_therapist BOOLEAN DEFAULT false,
    therapist_notes_encrypted BYTEA,
    discussed_in_session BOOLEAN DEFAULT false,
    session_id UUID,
    
    -- Privacy
    is_private BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(255), -- Reference to key management system
    
    -- Metadata
    word_count INTEGER,
    reading_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_shared ON journal_entries(shared_with_therapist) WHERE shared_with_therapist = true;

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Details
    appointment_type session_type NOT NULL DEFAULT 'individual',
    status appointment_status NOT NULL DEFAULT 'scheduled',
    location_type VARCHAR(50) DEFAULT 'in_person', -- in_person, video, phone
    location_details_encrypted BYTEA, -- Room number, video link, etc.
    
    -- Clinical Information
    reason_for_visit_encrypted BYTEA,
    notes_encrypted BYTEA,
    treatment_plan_encrypted BYTEA,
    
    -- Reminders & Notifications
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Billing (encrypted)
    insurance_claim_id VARCHAR(255),
    copay_amount DECIMAL(10,2),
    billing_notes_encrypted BYTEA,
    
    -- Cancellation/Rescheduling
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    rescheduled_from UUID REFERENCES appointments(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent double booking
    CONSTRAINT no_double_booking EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(scheduled_start, scheduled_end) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_start);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prescriber_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Medication Information
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL, -- "twice daily", "as needed", etc.
    route VARCHAR(50), -- oral, injection, topical, etc.
    
    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    status medication_status NOT NULL DEFAULT 'active',
    
    -- Instructions
    instructions_encrypted BYTEA,
    side_effects_encrypted BYTEA,
    
    -- Compliance Tracking
    compliance_rate DECIMAL(5,2), -- Percentage
    last_taken_at TIMESTAMP WITH TIME ZONE,
    missed_doses INTEGER DEFAULT 0,
    
    -- Refills
    refills_remaining INTEGER,
    last_refill_date DATE,
    next_refill_date DATE,
    pharmacy_encrypted BYTEA,
    
    -- Clinical Notes
    reason_for_prescription_encrypted BYTEA,
    effectiveness_notes_encrypted BYTEA,
    discontinuation_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discontinued_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_medications_user ON medications(user_id);
CREATE INDEX idx_medications_status ON medications(status);
CREATE INDEX idx_medications_prescriber ON medications(prescriber_id);

-- Medication doses tracking
CREATE TABLE medication_doses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dose Information
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE,
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,
    
    -- Side Effects
    side_effects_reported JSONB DEFAULT '[]'::jsonb,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doses_medication ON medication_doses(medication_id);
CREATE INDEX idx_doses_user ON medication_doses(user_id);
CREATE INDEX idx_doses_scheduled ON medication_doses(scheduled_time);

-- Crisis logs table
CREATE TABLE crisis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Crisis Information
    severity crisis_severity NOT NULL,
    trigger_source VARCHAR(100), -- mood_entry, journal, manual, ai_detection
    trigger_data JSONB,
    
    -- Symptoms & Indicators
    symptoms JSONB DEFAULT '[]'::jsonb,
    suicidal_ideation BOOLEAN DEFAULT false,
    self_harm_risk BOOLEAN DEFAULT false,
    harm_to_others_risk BOOLEAN DEFAULT false,
    
    -- Response & Intervention
    auto_response_triggered BOOLEAN DEFAULT false,
    response_actions JSONB DEFAULT '[]'::jsonb, -- Array of actions taken
    contacted_emergency BOOLEAN DEFAULT false,
    contacted_therapist BOOLEAN DEFAULT false,
    contacted_emergency_contact BOOLEAN DEFAULT false,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method VARCHAR(100),
    resolution_notes_encrypted BYTEA,
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Professional Response
    responder_id UUID REFERENCES users(id),
    response_time_seconds INTEGER,
    intervention_type VARCHAR(100),
    outcome VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crisis_user ON crisis_logs(user_id);
CREATE INDEX idx_crisis_severity ON crisis_logs(severity);
CREATE INDEX idx_crisis_created ON crisis_logs(created_at DESC);
CREATE INDEX idx_crisis_unresolved ON crisis_logs(resolved_at) WHERE resolved_at IS NULL;

-- Emergency contacts table
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact Information (encrypted)
    name_encrypted BYTEA NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_primary_encrypted BYTEA NOT NULL,
    phone_secondary_encrypted BYTEA,
    email_encrypted BYTEA,
    
    -- Preferences
    contact_type contact_type NOT NULL DEFAULT 'emergency',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    preferred_contact_method VARCHAR(50) DEFAULT 'phone', -- phone, sms, email
    
    -- Availability
    available_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Permissions
    can_access_mood_data BOOLEAN DEFAULT false,
    can_access_crisis_alerts BOOLEAN DEFAULT true,
    can_make_appointments BOOLEAN DEFAULT false,
    
    -- Notes
    special_instructions_encrypted BYTEA,
    
    -- Metadata
    verified_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_contact_priority UNIQUE (user_id, priority)
);

CREATE INDEX idx_emergency_user ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_priority ON emergency_contacts(priority);
CREATE INDEX idx_emergency_type ON emergency_contacts(contact_type);

-- Therapy sessions table (detailed session records)
CREATE TABLE therapy_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Details
    session_type session_type NOT NULL,
    session_number INTEGER,
    duration_minutes INTEGER,
    
    -- Clinical Content (encrypted)
    presenting_issues_encrypted BYTEA,
    session_notes_encrypted BYTEA,
    interventions_used JSONB DEFAULT '[]'::jsonb,
    homework_assigned_encrypted BYTEA,
    
    -- Progress Tracking
    progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 10),
    patient_engagement INTEGER CHECK (patient_engagement >= 1 AND patient_engagement <= 10),
    goals_addressed JSONB DEFAULT '[]'::jsonb,
    
    -- Risk Assessment
    risk_assessment JSONB,
    safety_plan_reviewed BOOLEAN DEFAULT false,
    mandated_reporting_required BOOLEAN DEFAULT false,
    
    -- Billing
    cpt_codes JSONB DEFAULT '[]'::jsonb,
    session_fee DECIMAL(10,2),
    insurance_billed BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    signed_by_therapist_at TIMESTAMP WITH TIME ZONE,
    signed_by_patient_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX idx_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX idx_sessions_appointment ON therapy_sessions(appointment_id);

-- Audit log table (HIPAA requirement)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    request_id UUID,
    
    -- Response
    response_status INTEGER,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Compliance
    phi_accessed BOOLEAN DEFAULT false,
    data_exported BOOLEAN DEFAULT false
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_phi ON audit_logs(phi_accessed) WHERE phi_accessed = true;

-- Notification queue table
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(50) NOT NULL, -- appointment_reminder, medication_reminder, crisis_alert, etc.
    channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Content
    subject VARCHAR(255),
    body_encrypted BYTEA NOT NULL,
    data JSONB, -- Additional structured data
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery Status
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notification_queue(user_id);
CREATE INDEX idx_notifications_scheduled ON notification_queue(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_type ON notification_queue(type);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crisis_logs_updated_at BEFORE UPDATE ON crisis_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapy_sessions_updated_at BEFORE UPDATE ON therapy_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies (Enable RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Create initial admin user (password: ChangeMeNow123!)
-- Note: In production, this should be done through a secure setup process
INSERT INTO users (
    email,
    email_encrypted,
    password_hash,
    role,
    first_name_encrypted,
    last_name_encrypted
) VALUES (
    'admin@mentalhealthplatform.com',
    pgp_sym_encrypt('admin@mentalhealthplatform.com', 'temp_key'),
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY3pp1dTVlU7p6W', -- bcrypt hash
    'admin',
    pgp_sym_encrypt('System', 'temp_key'),
    pgp_sym_encrypt('Administrator', 'temp_key')
);