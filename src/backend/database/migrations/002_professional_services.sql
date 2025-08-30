-- =====================================================================
-- Migration: 002_professional_services
-- Description: Professional services, therapists, and appointments
-- Date: 2025-08-30
-- =====================================================================

-- Check if migration has already been executed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_professional_services') THEN
        RAISE NOTICE 'Migration 002_professional_services already executed, skipping...';
        RETURN;
    END IF;
END
$$;

BEGIN;

-- =====================================================================
-- PROFESSIONAL SERVICES TABLES
-- =====================================================================

-- Therapist profiles
CREATE TABLE IF NOT EXISTS therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_type TEXT,
    license_number TEXT,
    license_state TEXT,
    license_expiry DATE,
    npi_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_documents JSONB,
    specializations TEXT[],
    treatment_approaches TEXT[],
    languages_spoken TEXT[],
    years_experience INTEGER,
    education JSONB,
    certifications JSONB,
    practice_name TEXT,
    practice_address TEXT,
    accepts_insurance BOOLEAN DEFAULT false,
    insurance_accepted TEXT[],
    session_rate DECIMAL(10,2),
    sliding_scale BOOLEAN DEFAULT false,
    accepting_new_clients BOOLEAN DEFAULT true,
    online_therapy BOOLEAN DEFAULT true,
    in_person_therapy BOOLEAN DEFAULT false,
    availability_schedule JSONB,
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
    appointment_type TEXT CHECK (appointment_type IN ('initial', 'followup', 'crisis', 'group', 'assessment')),
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 50,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    location_type TEXT CHECK (location_type IN ('online', 'in_person', 'phone')),
    location_details JSONB,
    video_link TEXT,
    appointment_notes TEXT,
    cancellation_reason TEXT,
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
    chief_complaint TEXT,
    session_content TEXT,
    interventions_used TEXT[],
    homework_assigned TEXT,
    mental_status_exam JSONB,
    risk_assessment JSONB,
    progress_notes TEXT,
    treatment_plan_progress JSONB,
    followup_required BOOLEAN DEFAULT false,
    next_session_focus TEXT,
    note_type TEXT CHECK (note_type IN ('soap', 'dap', 'birp', 'girp', 'narrative')),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    version TEXT,
    raw_score INTEGER,
    normalized_score DECIMAL(5,2),
    severity_level TEXT,
    risk_level TEXT,
    results JSONB,
    recommendations TEXT[],
    followup_needed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    clinical_notes TEXT,
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
    title TEXT NOT NULL,
    description TEXT,
    diagnosis_codes TEXT[],
    treatment_goals JSONB,
    interventions JSONB,
    start_date DATE,
    end_date DATE,
    review_frequency TEXT,
    next_review_date DATE,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'discontinued')) DEFAULT 'draft',
    progress_notes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment goals
CREATE TABLE IF NOT EXISTS treatment_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    goal_type TEXT CHECK (goal_type IN ('short_term', 'long_term', 'ongoing')),
    category TEXT,
    measurable_criteria TEXT[],
    target_date DATE,
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'achieved', 'discontinued')) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    progress_notes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prescriber_id UUID REFERENCES users(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    dosage TEXT,
    frequency TEXT,
    route TEXT,
    start_date DATE,
    end_date DATE,
    refills_remaining INTEGER,
    instructions TEXT,
    warnings TEXT[],
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
    taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dosage_taken TEXT,
    skipped BOOLEAN DEFAULT false,
    skip_reason TEXT,
    side_effects TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis assessments
CREATE TABLE IF NOT EXISTS crisis_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
    suicidal_ideation_score INTEGER,
    self_harm_risk_score INTEGER,
    danger_to_others_score INTEGER,
    substance_use_risk_score INTEGER,
    risk_factors JSONB,
    protective_factors JSONB,
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    clinical_impression TEXT,
    recommended_actions TEXT[],
    requires_immediate_attention BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_risk_level TEXT CHECK (overall_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    suicide_risk_level TEXT CHECK (suicide_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    self_harm_risk_level TEXT CHECK (self_harm_risk_level IN ('minimal', 'low', 'moderate', 'high', 'severe')),
    risk_factors JSONB,
    protective_factors JSONB,
    warning_signs JSONB,
    assessment_tool TEXT,
    assessment_score INTEGER,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    next_assessment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_therapists_user_id ON therapists(user_id);
CREATE INDEX idx_therapists_is_verified ON therapists(is_verified);
CREATE INDEX idx_therapists_accepting_new_clients ON therapists(accepting_new_clients);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_therapist_id ON appointments(therapist_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_session_notes_appointment_id ON session_notes(appointment_id);
CREATE INDEX idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX idx_session_notes_user_id ON session_notes(user_id);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_assessment_type ON assessments(assessment_type);

CREATE INDEX idx_treatment_plans_user_id ON treatment_plans(user_id);
CREATE INDEX idx_treatment_plans_therapist_id ON treatment_plans(therapist_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);

CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

CREATE INDEX idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX idx_medication_logs_prescription_id ON medication_logs(prescription_id);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_goals_updated_at BEFORE UPDATE ON treatment_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Therapists can see their own profile
CREATE POLICY therapists_own_profile ON therapists FOR ALL USING (user_id = auth.uid());

-- Users can see their appointments
CREATE POLICY appointments_own_data ON appointments FOR SELECT USING (user_id = auth.uid());

-- Therapists can manage their appointments
CREATE POLICY appointments_therapist_access ON appointments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM therapists WHERE therapists.id = appointments.therapist_id AND therapists.user_id = auth.uid()
    )
);

-- Session notes are only accessible to the therapist and patient
CREATE POLICY session_notes_access ON session_notes FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM therapists WHERE therapists.id = session_notes.therapist_id AND therapists.user_id = auth.uid()
    )
);

-- Users can see their own assessments
CREATE POLICY assessments_own_data ON assessments FOR ALL USING (user_id = auth.uid());

-- Users can see their own treatment plans
CREATE POLICY treatment_plans_own_data ON treatment_plans FOR SELECT USING (user_id = auth.uid());

-- Therapists can manage treatment plans for their patients
CREATE POLICY treatment_plans_therapist_access ON treatment_plans FOR ALL USING (
    therapist_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointments.user_id = treatment_plans.user_id 
        AND appointments.therapist_id IN (
            SELECT id FROM therapists WHERE user_id = auth.uid()
        )
    )
);

-- Users can see their own prescriptions
CREATE POLICY prescriptions_own_data ON prescriptions FOR SELECT USING (user_id = auth.uid());

-- Users can log their medications
CREATE POLICY medication_logs_own_data ON medication_logs FOR ALL USING (user_id = auth.uid());

-- Record migration completion
INSERT INTO schema_migrations (version) VALUES ('002_professional_services');

COMMIT;

DO $$
BEGIN
    RAISE NOTICE 'Migration 002_professional_services completed successfully';
END
$$;