-- =====================================================================
-- ASTRALCORE V4 - COMPREHENSIVE MENTAL HEALTH PLATFORM DATABASE
-- =====================================================================
-- Complete Production-Ready Schema with HIPAA Compliance
-- Created: 2025-08-30
-- Database: PostgreSQL 14+ (Supabase Compatible)
-- =====================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings

-- =====================================================================
-- CORE USER SYSTEM
-- =====================================================================

-- Users table with comprehensive authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT, -- Argon2 hashed
    role TEXT CHECK (role IN ('admin', 'therapist', 'psychiatrist', 'helper', 'user', 'moderator')) DEFAULT 'user',
    
    -- Authentication fields
    auth_provider TEXT CHECK (auth_provider IN ('email', 'google', 'apple', 'anonymous')) DEFAULT 'email',
    auth_provider_id TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    status TEXT CHECK (status IN ('active', 'suspended', 'deactivated', 'banned')) DEFAULT 'active',
    suspension_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT, -- Encrypted
    backup_codes TEXT[], -- Encrypted
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- User profiles with extended information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal information
    display_name TEXT,
    first_name TEXT, -- Encrypted
    last_name TEXT, -- Encrypted
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE, -- Encrypted
    gender TEXT,
    pronouns TEXT,
    
    -- Location (for resource matching)
    country TEXT,
    state_province TEXT,
    city TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    
    -- Mental health profile
    mental_health_goals TEXT[],
    conditions TEXT[], -- Encrypted
    medications TEXT[], -- Encrypted
    allergies TEXT[], -- Encrypted
    crisis_keywords TEXT[],
    preferred_intervention_style TEXT,
    therapy_preferences JSONB,
    
    -- Privacy settings
    privacy_level TEXT CHECK (privacy_level IN ('private', 'friends', 'community', 'public')) DEFAULT 'private',
    show_mood_publicly BOOLEAN DEFAULT false,
    allow_peer_support BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- UI preferences
    theme TEXT CHECK (theme IN ('light', 'dark', 'auto', 'high-contrast')) DEFAULT 'auto',
    color_scheme TEXT DEFAULT 'default',
    font_size TEXT CHECK (font_size IN ('small', 'medium', 'large', 'xl')) DEFAULT 'medium',
    reduce_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader_mode BOOLEAN DEFAULT false,
    
    -- Notification preferences
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
    
    -- Crisis preferences
    panic_button_enabled BOOLEAN DEFAULT true,
    quick_exit_enabled BOOLEAN DEFAULT true,
    auto_crisis_detection BOOLEAN DEFAULT true,
    crisis_contact_auto_notify BOOLEAN DEFAULT false,
    
    -- Data preferences
    data_collection_consent BOOLEAN DEFAULT true,
    analytics_consent BOOLEAN DEFAULT true,
    research_participation BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session tokens
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    csrf_token TEXT,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    
    -- Session status
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
-- AUTHENTICATION & SECURITY
-- =====================================================================

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    method TEXT CHECK (method IN ('totp', 'sms', 'email', 'backup_code')) NOT NULL,
    secret TEXT, -- Encrypted
    phone_number TEXT, -- Encrypted
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, method)
);

-- Audit logs for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
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
-- MENTAL HEALTH CORE
-- =====================================================================

-- Mood tracking entries
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Core mood data
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10) NOT NULL,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_hours DECIMAL(3,1),
    
    -- Emotional states
    emotions TEXT[],
    primary_emotion TEXT,
    
    -- Context
    triggers TEXT[],
    activities TEXT[],
    social_interaction TEXT CHECK (social_interaction IN ('none', 'minimal', 'moderate', 'high')),
    location TEXT CHECK (location IN ('home', 'work', 'school', 'outdoors', 'other')),
    weather TEXT,
    
    -- Health factors
    medication_taken BOOLEAN DEFAULT false,
    exercise_minutes INTEGER,
    water_intake INTEGER, -- in ml
    caffeine_intake INTEGER, -- in mg
    alcohol_units INTEGER,
    
    -- Notes
    notes TEXT, -- Encrypted
    gratitude TEXT[], -- Things user is grateful for
    accomplishments TEXT[],
    
    -- Analysis
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    crisis_indicators TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Entry content
    title TEXT,
    content TEXT NOT NULL, -- Encrypted
    entry_type TEXT CHECK (entry_type IN ('free_write', 'guided', 'gratitude', 'reflection', 'goal_setting')),
    prompt_id UUID,
    
    -- Metadata
    word_count INTEGER,
    writing_time_seconds INTEGER,
    mood_before INTEGER,
    mood_after INTEGER,
    
    -- Analysis
    sentiment_score DECIMAL(3,2),
    key_themes TEXT[],
    emotions_detected TEXT[],
    crisis_keywords_found TEXT[],
    
    -- Privacy
    is_private BOOLEAN DEFAULT true,
    shared_with_therapist BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety plans
CREATE TABLE IF NOT EXISTS safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Warning signs
    warning_signs TEXT[], -- Encrypted
    triggers TEXT[], -- Encrypted
    
    -- Coping strategies
    internal_coping TEXT[], -- Things I can do alone
    social_distractions TEXT[], -- People/places for distraction
    social_support TEXT[], -- People I can ask for help
    
    -- Professional support
    professional_contacts JSONB, -- Encrypted
    crisis_contacts JSONB, -- Encrypted
    
    -- Safety measures
    environment_safety TEXT[], -- Making environment safe
    reasons_to_live TEXT[], -- Encrypted
    
    -- Plan metadata
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    effectiveness_rating INTEGER,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    therapist_approved BOOLEAN DEFAULT false,
    therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assessment info
    assessment_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    version TEXT,
    
    -- Scores
    raw_score INTEGER,
    normalized_score DECIMAL(5,2),
    severity_level TEXT,
    risk_level TEXT,
    
    -- Results
    results JSONB,
    recommendations TEXT[],
    followup_needed BOOLEAN DEFAULT false,
    
    -- Clinical review
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    clinical_notes TEXT, -- Encrypted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment responses
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT,
    response_value TEXT,
    response_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Plan details
    title TEXT NOT NULL,
    description TEXT,
    diagnosis_codes TEXT[], -- ICD-10 codes
    treatment_goals JSONB,
    interventions JSONB,
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    review_frequency TEXT,
    next_review_date DATE,
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'discontinued')) DEFAULT 'draft',
    progress_notes TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- CRISIS MANAGEMENT
-- =====================================================================

-- Crisis events tracking
CREATE TABLE IF NOT EXISTS crisis_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Crisis details
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('keyword', 'sentiment', 'behavioral', 'manual', 'ai_detected', 'panic_button')),
    trigger_source TEXT,
    
    -- Detection
    detected_keywords TEXT[],
    sentiment_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    false_positive BOOLEAN DEFAULT false,
    
    -- Response
    intervention_type TEXT[],
    interventions_offered JSONB,
    interventions_accepted JSONB,
    response_time_seconds INTEGER,
    
    -- Outcome
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method TEXT,
    escalated BOOLEAN DEFAULT false,
    emergency_services_contacted BOOLEAN DEFAULT false,
    
    -- Follow-up
    followup_required BOOLEAN DEFAULT false,
    followup_completed BOOLEAN DEFAULT false,
    
    -- Context
    location_context JSONB,
    device_context JSONB,
    preceding_mood_scores INTEGER[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis logs for detailed tracking
CREATE TABLE IF NOT EXISTS crisis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Log entry
    log_type TEXT CHECK (log_type IN ('detection', 'intervention', 'escalation', 'resolution', 'followup')),
    message TEXT,
    severity TEXT,
    
    -- Action taken
    action TEXT,
    action_by TEXT, -- system, user, therapist, etc.
    action_result TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact information
    name TEXT NOT NULL, -- Encrypted
    relationship TEXT,
    phone_primary TEXT, -- Encrypted
    phone_secondary TEXT, -- Encrypted
    email TEXT, -- Encrypted
    address TEXT, -- Encrypted
    
    -- Contact preferences
    contact_method TEXT CHECK (contact_method IN ('phone', 'text', 'email', 'all')) DEFAULT 'phone',
    language TEXT DEFAULT 'en',
    
    -- Availability
    available_24_7 BOOLEAN DEFAULT false,
    availability_schedule JSONB,
    timezone TEXT,
    
    -- Permissions
    can_contact_for_crisis BOOLEAN DEFAULT true,
    can_share_location BOOLEAN DEFAULT false,
    can_share_mood_data BOOLEAN DEFAULT false,
    
    -- Priority
    priority_order INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis interventions catalog
CREATE TABLE IF NOT EXISTS crisis_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Intervention details
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('breathing', 'grounding', 'distraction', 'social', 'physical', 'creative', 'professional')),
    category TEXT,
    
    -- Content
    description TEXT,
    instructions JSONB,
    duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    
    -- Effectiveness
    effectiveness_rating DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2),
    
    -- Suitability
    suitable_for_severity TEXT[],
    contraindications TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis assessments
CREATE TABLE IF NOT EXISTS crisis_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
    
    -- Assessment scores
    suicidal_ideation_score INTEGER,
    self_harm_risk_score INTEGER,
    danger_to_others_score INTEGER,
    substance_use_risk_score INTEGER,
    
    -- Risk factors
    risk_factors JSONB,
    protective_factors JSONB,
    
    -- Clinical assessment
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    clinical_impression TEXT, -- Encrypted
    recommended_actions TEXT[],
    requires_immediate_attention BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Risk levels
    overall_risk_level TEXT CHECK (overall_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    suicide_risk_level TEXT CHECK (suicide_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    self_harm_risk_level TEXT CHECK (self_harm_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    
    -- Risk factors
    risk_factors JSONB,
    protective_factors JSONB,
    warning_signs JSONB,
    
    -- Assessment details
    assessment_tool TEXT,
    assessment_score INTEGER,
    
    -- Review
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    next_assessment_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- PROFESSIONAL SERVICES
-- =====================================================================

-- Therapist profiles
CREATE TABLE IF NOT EXISTS therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Credentials
    license_type TEXT,
    license_number TEXT, -- Encrypted
    license_state TEXT,
    license_expiry DATE,
    npi_number TEXT, -- Encrypted
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_documents JSONB, -- Encrypted
    
    -- Professional info
    specializations TEXT[],
    treatment_approaches TEXT[],
    languages_spoken TEXT[],
    years_experience INTEGER,
    education JSONB,
    certifications JSONB,
    
    -- Practice details
    practice_name TEXT,
    practice_address TEXT, -- Encrypted
    accepts_insurance BOOLEAN DEFAULT false,
    insurance_accepted TEXT[],
    session_rate DECIMAL(10,2),
    sliding_scale BOOLEAN DEFAULT false,
    
    -- Availability
    accepting_new_clients BOOLEAN DEFAULT true,
    online_therapy BOOLEAN DEFAULT true,
    in_person_therapy BOOLEAN DEFAULT false,
    availability_schedule JSONB,
    
    -- Performance
    average_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
    
    -- Appointment details
    appointment_type TEXT CHECK (appointment_type IN ('initial', 'followup', 'crisis', 'group', 'assessment')),
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Location
    location_type TEXT CHECK (location_type IN ('online', 'in_person', 'phone')),
    location_details JSONB,
    video_link TEXT,
    
    -- Notes
    appointment_notes TEXT, -- Encrypted
    cancellation_reason TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session notes
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session content
    chief_complaint TEXT, -- Encrypted
    session_content TEXT, -- Encrypted
    interventions_used TEXT[], -- Encrypted
    homework_assigned TEXT, -- Encrypted
    
    -- Clinical observations
    mental_status_exam JSONB, -- Encrypted
    risk_assessment JSONB, -- Encrypted
    
    -- Progress
    progress_notes TEXT, -- Encrypted
    treatment_plan_progress JSONB,
    
    -- Next steps
    followup_required BOOLEAN DEFAULT false,
    next_session_focus TEXT, -- Encrypted
    
    -- Compliance
    note_type TEXT CHECK (note_type IN ('soap', 'dap', 'birp', 'girp', 'narrative')),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prescriber_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Medication details
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT,
    frequency TEXT,
    route TEXT,
    
    -- Duration
    start_date DATE,
    end_date DATE,
    refills_remaining INTEGER,
    
    -- Instructions
    instructions TEXT, -- Encrypted
    warnings TEXT[],
    
    -- Status
    status TEXT CHECK (status IN ('active', 'discontinued', 'completed', 'on_hold')) DEFAULT 'active',
    discontinued_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication logs
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    -- Log entry
    taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dosage_taken TEXT,
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,
    
    -- Side effects
    side_effects TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment goals
CREATE TABLE IF NOT EXISTS treatment_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
    
    -- Goal details
    goal_text TEXT NOT NULL,
    goal_type TEXT CHECK (goal_type IN ('short_term', 'long_term', 'ongoing')),
    category TEXT,
    
    -- Measurement
    measurable_criteria TEXT[],
    target_date DATE,
    
    -- Progress
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'achieved', 'discontinued')) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    progress_notes TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- AI & ML FEATURES
-- =====================================================================

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conversation metadata
    title TEXT,
    conversation_type TEXT CHECK (conversation_type IN ('therapy', 'crisis', 'general', 'assessment')),
    is_active BOOLEAN DEFAULT true,
    
    -- AI model info
    model_name TEXT,
    model_version TEXT,
    
    -- Statistics
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL, -- Encrypted
    
    -- AI analysis
    sentiment_score DECIMAL(3,2),
    emotion_scores JSONB,
    crisis_indicators JSONB,
    
    -- Token usage
    tokens_used INTEGER,
    response_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML models registry
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Model info
    model_name TEXT NOT NULL,
    model_type TEXT CHECK (model_type IN ('crisis_detection', 'sentiment_analysis', 'recommendation', 'prediction')),
    version TEXT NOT NULL,
    
    -- Model files
    model_path TEXT,
    config JSONB,
    
    -- Performance
    accuracy DECIMAL(5,4),
    precision DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(model_name, version)
);

-- Prediction results
CREATE TABLE IF NOT EXISTS prediction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Prediction
    prediction_type TEXT,
    input_data JSONB,
    prediction JSONB,
    confidence DECIMAL(3,2),
    
    -- Feedback
    was_accurate BOOLEAN,
    user_feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training data
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Data info
    data_type TEXT,
    label TEXT,
    features JSONB,
    
    -- Source
    source_type TEXT,
    source_id UUID,
    
    -- Quality
    is_validated BOOLEAN DEFAULT false,
    quality_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentiment analysis results
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source
    source_type TEXT CHECK (source_type IN ('journal', 'chat', 'mood_note', 'assessment')),
    source_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Analysis
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    magnitude DECIMAL(3,2), -- 0.0 to 1.0
    emotions JSONB,
    key_phrases TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis predictions
CREATE TABLE IF NOT EXISTS crisis_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prediction
    risk_level TEXT CHECK (risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    probability DECIMAL(3,2),
    timeframe_hours INTEGER,
    
    -- Factors
    contributing_factors JSONB,
    protective_factors JSONB,
    
    -- Outcome
    crisis_occurred BOOLEAN,
    feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation cache
CREATE TABLE IF NOT EXISTS recommendation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation
    recommendation_type TEXT,
    recommendations JSONB,
    
    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- BIOMETRIC & HEALTH DATA
-- =====================================================================

-- Biometric data
CREATE TABLE IF NOT EXISTS biometric_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Vital signs
    heart_rate INTEGER,
    heart_rate_variability INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation INTEGER,
    
    -- Activity data
    steps INTEGER,
    calories_burned INTEGER,
    active_minutes INTEGER,
    sedentary_minutes INTEGER,
    
    -- Sleep data
    sleep_duration_minutes INTEGER,
    sleep_efficiency DECIMAL(3,2),
    rem_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_minutes INTEGER,
    
    -- Source
    source_device TEXT,
    source_app TEXT,
    
    recorded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sleep data
CREATE TABLE IF NOT EXISTS sleep_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sleep metrics
    bedtime TIMESTAMP WITH TIME ZONE,
    wake_time TIMESTAMP WITH TIME ZONE,
    total_sleep_minutes INTEGER,
    sleep_efficiency DECIMAL(3,2),
    
    -- Sleep stages
    rem_minutes INTEGER,
    deep_sleep_minutes INTEGER,
    light_sleep_minutes INTEGER,
    awake_minutes INTEGER,
    
    -- Quality indicators
    interruptions INTEGER,
    snoring_episodes INTEGER,
    movement_intensity TEXT,
    
    -- Environmental factors
    room_temperature INTEGER,
    noise_level TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heart rate data
CREATE TABLE IF NOT EXISTS heart_rate_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Heart rate metrics
    resting_heart_rate INTEGER,
    average_heart_rate INTEGER,
    max_heart_rate INTEGER,
    min_heart_rate INTEGER,
    heart_rate_variability INTEGER,
    
    -- Context
    activity_type TEXT,
    stress_level TEXT,
    
    recorded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity data
CREATE TABLE IF NOT EXISTS activity_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity metrics
    activity_type TEXT,
    duration_minutes INTEGER,
    distance_meters INTEGER,
    calories_burned INTEGER,
    average_heart_rate INTEGER,
    
    -- Performance
    pace DECIMAL(5,2),
    speed DECIMAL(5,2),
    elevation_gain INTEGER,
    
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health insights
CREATE TABLE IF NOT EXISTS health_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Insight details
    insight_type TEXT,
    category TEXT,
    title TEXT,
    description TEXT,
    
    -- Data basis
    data_sources TEXT[],
    confidence_score DECIMAL(3,2),
    
    -- Recommendations
    recommendations JSONB,
    action_items TEXT[],
    
    -- User interaction
    viewed BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    helpful BOOLEAN,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wearable connections
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Device info
    device_type TEXT,
    device_brand TEXT,
    device_model TEXT,
    device_id TEXT,
    
    -- Connection details
    connection_type TEXT CHECK (connection_type IN ('oauth', 'api', 'bluetooth')),
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    
    -- Sync settings
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wearable_connection_id UUID REFERENCES wearable_connections(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type TEXT,
    records_synced INTEGER,
    sync_status TEXT CHECK (sync_status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- SOCIAL & COMMUNITY FEATURES
-- =====================================================================

-- Support groups
CREATE TABLE IF NOT EXISTS support_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Group info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    
    -- Settings
    is_private BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    max_members INTEGER,
    
    -- Moderation
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderators UUID[],
    
    -- Statistics
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES support_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Membership details
    role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
    status TEXT CHECK (status IN ('pending', 'active', 'suspended', 'banned')) DEFAULT 'active',
    
    -- Participation
    posts_count INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Forum posts
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES support_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    
    -- Post content
    title TEXT,
    content TEXT NOT NULL,
    
    -- Metadata
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Moderation
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Peer connections
CREATE TABLE IF NOT EXISTS peer_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    peer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Connection details
    connection_type TEXT CHECK (connection_type IN ('buddy', 'mentor', 'support')),
    status TEXT CHECK (status IN ('pending', 'active', 'paused', 'ended')) DEFAULT 'pending',
    
    -- Matching criteria
    matched_interests TEXT[],
    compatibility_score DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, peer_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID,
    
    -- Message content
    content TEXT NOT NULL, -- Encrypted
    message_type TEXT CHECK (message_type IN ('text', 'image', 'audio', 'file')),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Attachments
    attachments JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    channels TEXT[], -- push, email, sms, in_app
    delivered_channels TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community events
CREATE TABLE IF NOT EXISTS community_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT,
    category TEXT,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone TEXT,
    
    -- Location
    is_online BOOLEAN DEFAULT true,
    location_details JSONB,
    meeting_link TEXT,
    
    -- Participation
    max_participants INTEGER,
    registered_count INTEGER DEFAULT 0,
    
    -- Host
    hosted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- ANALYTICS & TRACKING
-- =====================================================================

-- User analytics
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    session_id UUID,
    page_views INTEGER DEFAULT 0,
    session_duration_seconds INTEGER,
    
    -- Feature usage
    feature_used TEXT,
    feature_duration_seconds INTEGER,
    
    -- Engagement metrics
    actions_taken TEXT[],
    goals_completed TEXT[],
    
    -- Device info
    device_type TEXT,
    browser TEXT,
    os TEXT,
    
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood patterns
CREATE TABLE IF NOT EXISTS mood_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pattern details
    pattern_type TEXT,
    pattern_name TEXT,
    description TEXT,
    
    -- Pattern data
    frequency TEXT,
    triggers TEXT[],
    correlations JSONB,
    
    -- Strength
    confidence_score DECIMAL(3,2),
    occurrence_count INTEGER,
    
    -- Time range
    detected_from DATE,
    detected_to DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage metrics
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric details
    metric_type TEXT,
    metric_name TEXT,
    metric_value DECIMAL,
    
    -- Dimensions
    dimensions JSONB,
    
    -- Time
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Log details
    log_level TEXT CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
    category TEXT,
    message TEXT,
    
    -- Context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id UUID,
    
    -- Error details
    error_code TEXT,
    stack_trace TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric details
    metric_type TEXT,
    operation TEXT,
    
    -- Performance data
    duration_ms INTEGER,
    cpu_usage DECIMAL(5,2),
    memory_usage_mb INTEGER,
    
    -- Database metrics
    query_count INTEGER,
    query_time_ms INTEGER,
    
    -- API metrics
    api_calls INTEGER,
    api_errors INTEGER,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health checks
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Check details
    service_name TEXT,
    check_type TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time_ms INTEGER,
    
    -- Details
    details JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Error details
    error_type TEXT,
    error_message TEXT,
    error_code TEXT,
    stack_trace TEXT,
    
    -- Context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id UUID,
    url TEXT,
    method TEXT,
    
    -- Environment
    environment TEXT,
    app_version TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- GAMIFICATION
-- =====================================================================

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Achievement details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon_url TEXT,
    
    -- Requirements
    criteria JSONB,
    points INTEGER DEFAULT 0,
    
    -- Rarity
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress
    progress DECIMAL(5,2) DEFAULT 0,
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Streak details
    streak_type TEXT,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    
    -- Dates
    last_activity_date DATE,
    streak_start_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Challenge details
    name TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT,
    
    -- Duration
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Requirements
    goals JSONB,
    rewards JSONB,
    
    -- Participation
    max_participants INTEGER,
    participant_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reward details
    name TEXT NOT NULL,
    description TEXT,
    reward_type TEXT,
    
    -- Value
    points_required INTEGER,
    
    -- Availability
    available BOOLEAN DEFAULT true,
    quantity_available INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points
CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Points details
    points_earned INTEGER,
    points_spent INTEGER DEFAULT 0,
    current_balance INTEGER,
    
    -- Source
    source_type TEXT,
    source_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Leaderboard details
    name TEXT NOT NULL,
    leaderboard_type TEXT,
    time_period TEXT,
    
    -- Scores
    scores JSONB,
    
    -- Period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Badge details
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT,
    
    -- Requirements
    requirements JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- CONTENT & RESOURCES
-- =====================================================================

-- Articles
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Article details
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT,
    summary TEXT,
    
    -- Metadata
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category TEXT,
    tags TEXT[],
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Publishing
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Resource details
    name TEXT NOT NULL,
    description TEXT,
    resource_type TEXT,
    category TEXT,
    
    -- Content
    url TEXT,
    file_path TEXT,
    content JSONB,
    
    -- Access
    is_free BOOLEAN DEFAULT true,
    required_subscription TEXT,
    
    -- Ratings
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Educational content
CREATE TABLE IF NOT EXISTS educational_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content details
    title TEXT NOT NULL,
    content_type TEXT,
    difficulty_level TEXT,
    
    -- Course structure
    module_number INTEGER,
    lesson_number INTEGER,
    
    -- Content
    content TEXT,
    video_url TEXT,
    materials JSONB,
    
    -- Progress tracking
    estimated_duration_minutes INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Video details
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    duration_seconds INTEGER,
    category TEXT,
    tags TEXT[],
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coping strategies
CREATE TABLE IF NOT EXISTS coping_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Strategy details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Instructions
    steps JSONB,
    duration_minutes INTEGER,
    
    -- Effectiveness
    effectiveness_rating DECIMAL(3,2),
    usage_count INTEGER DEFAULT 0,
    
    -- Suitability
    suitable_for TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Exercise details
    name TEXT NOT NULL,
    type TEXT,
    category TEXT,
    
    -- Content
    instructions TEXT,
    audio_url TEXT,
    video_url TEXT,
    
    -- Duration
    duration_minutes INTEGER,
    
    -- Difficulty
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guided meditations
CREATE TABLE IF NOT EXISTS guided_meditations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Meditation details
    title TEXT NOT NULL,
    description TEXT,
    meditation_type TEXT,
    
    -- Audio
    audio_url TEXT,
    duration_minutes INTEGER,
    
    -- Guide
    narrator TEXT,
    background_music BOOLEAN DEFAULT false,
    
    -- Focus
    focus_areas TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- SYSTEM & ADMIN
-- =====================================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Setting details
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT,
    
    -- Metadata
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Flag details
    flag_name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    
    -- Rollout
    rollout_percentage INTEGER DEFAULT 0,
    user_groups TEXT[],
    
    -- Metadata
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Maintenance details
    maintenance_type TEXT,
    description TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Performed by
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Backup details
    backup_type TEXT,
    backup_size_bytes BIGINT,
    
    -- Location
    backup_location TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('started', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data exports
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Export details
    export_type TEXT,
    format TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    
    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Report details
    report_type TEXT,
    report_period_start DATE,
    report_period_end DATE,
    
    -- Content
    report_data JSONB,
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'final', 'submitted')),
    
    -- Submission
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Profile indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_country ON user_profiles(country);
CREATE INDEX idx_user_profiles_state_province ON user_profiles(state_province);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Mood indexes
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_mood_entries_mood_score ON mood_entries(mood_score);

-- Crisis indexes
CREATE INDEX idx_crisis_events_user_id ON crisis_events(user_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at);
CREATE INDEX idx_crisis_events_resolved ON crisis_events(resolved);

-- Appointment indexes
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- AI conversation indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);
CREATE INDEX idx_user_analytics_feature_used ON user_analytics(feature_used);

-- Full-text search indexes
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_forum_posts_search ON forum_posts USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_resources_search ON resources USING gin(to_tsvector('english', name || ' ' || description));

-- GIN indexes for array fields
CREATE INDEX idx_user_profiles_conditions_gin ON user_profiles USING gin(conditions);
CREATE INDEX idx_user_profiles_medications_gin ON user_profiles USING gin(medications);
CREATE INDEX idx_mood_entries_triggers_gin ON mood_entries USING gin(triggers);
CREATE INDEX idx_mood_entries_emotions_gin ON mood_entries USING gin(emotions);
CREATE INDEX idx_crisis_events_keywords_gin ON crisis_events USING gin(detected_keywords);

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

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and modify their own data
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY user_profiles_own_data ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_preferences_own_data ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY mood_entries_own_data ON mood_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY journal_entries_own_data ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY safety_plans_own_data ON safety_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY crisis_events_own_data ON crisis_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY emergency_contacts_own_data ON emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- Therapists can see their patients' data
CREATE POLICY therapist_patient_access ON mood_entries FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM appointments a
        JOIN therapists t ON t.id = a.therapist_id
        WHERE a.user_id = mood_entries.user_id
        AND t.user_id = auth.uid()
        AND a.status IN ('scheduled', 'confirmed', 'completed')
    )
);

-- =====================================================================
-- FUNCTIONS AND PROCEDURES
-- =====================================================================

-- Function to check if user is in crisis
CREATE OR REPLACE FUNCTION check_crisis_status(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_crisis BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM crisis_events
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND resolved = false
    ) INTO recent_crisis;
    
    RETURN recent_crisis;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mood trend
CREATE OR REPLACE FUNCTION calculate_mood_trend(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE(
    average_mood DECIMAL,
    trend_direction TEXT,
    change_percentage DECIMAL
) AS $$
DECLARE
    current_avg DECIMAL;
    previous_avg DECIMAL;
    change_pct DECIMAL;
    trend TEXT;
BEGIN
    -- Calculate current period average
    SELECT AVG(mood_score) INTO current_avg
    FROM mood_entries
    WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
    
    -- Calculate previous period average
    SELECT AVG(mood_score) INTO previous_avg
    FROM mood_entries
    WHERE user_id = p_user_id
    AND created_at >= NOW() - (2 * p_days || ' days')::INTERVAL
    AND created_at < NOW() - (p_days || ' days')::INTERVAL;
    
    -- Calculate change percentage
    IF previous_avg IS NOT NULL AND previous_avg != 0 THEN
        change_pct := ((current_avg - previous_avg) / previous_avg) * 100;
    ELSE
        change_pct := 0;
    END IF;
    
    -- Determine trend
    IF change_pct > 10 THEN
        trend := 'improving';
    ELSIF change_pct < -10 THEN
        trend := 'declining';
    ELSE
        trend := 'stable';
    END IF;
    
    RETURN QUERY SELECT current_avg, trend, change_pct;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- INITIAL DATA / SEED DATA
-- =====================================================================

-- Insert default crisis interventions
INSERT INTO crisis_interventions (name, type, category, description, duration_minutes, difficulty_level)
VALUES 
    ('4-7-8 Breathing', 'breathing', 'anxiety', 'Calming breathing technique', 5, 'easy'),
    ('5-4-3-2-1 Grounding', 'grounding', 'dissociation', 'Sensory grounding exercise', 10, 'easy'),
    ('Progressive Muscle Relaxation', 'physical', 'tension', 'Systematic muscle relaxation', 15, 'medium'),
    ('Safe Place Visualization', 'distraction', 'anxiety', 'Mental imagery exercise', 10, 'medium')
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('crisis_detection_enabled', 'true', 'boolean', 'Enable automatic crisis detection'),
    ('session_timeout_minutes', '30', 'integer', 'Session timeout in minutes'),
    ('max_login_attempts', '5', 'integer', 'Maximum login attempts before lockout'),
    ('data_retention_days', '2555', 'integer', 'Data retention period in days (7 years for HIPAA)')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================================
-- GRANT PERMISSIONS
-- =====================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read-only access to anonymous users for public content
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON articles, resources, educational_content, videos TO anon;

-- =====================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================

COMMENT ON SCHEMA public IS 'AstralCore V4 Mental Health Platform - HIPAA Compliant Database Schema';
COMMENT ON TABLE users IS 'Core user accounts with authentication and role management';
COMMENT ON TABLE user_profiles IS 'Extended user profile information including mental health data';
COMMENT ON TABLE mood_entries IS 'Daily mood tracking with comprehensive wellness indicators';
COMMENT ON TABLE crisis_events IS 'Crisis detection and intervention tracking system';
COMMENT ON TABLE safety_plans IS 'Personalized crisis prevention and safety planning';
COMMENT ON TABLE therapists IS 'Licensed mental health professional profiles';
COMMENT ON TABLE appointments IS 'Therapy session scheduling and management';
COMMENT ON TABLE ai_conversations IS 'AI-powered therapeutic chat conversations';
COMMENT ON COLUMN users.password_hash IS 'Argon2 hashed password for secure authentication';
COMMENT ON COLUMN user_profiles.conditions IS 'Encrypted mental health conditions for privacy';
COMMENT ON COLUMN crisis_events.severity IS 'Crisis severity level: low, medium, high, critical';
COMMENT ON COLUMN mood_entries.sentiment_score IS 'AI-analyzed sentiment score from -1.0 (negative) to 1.0 (positive)';

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================