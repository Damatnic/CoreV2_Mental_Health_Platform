-- Migration: 002_add_audit_tables
-- Created: 2024-01-02
-- Description: Add audit and compliance tables for HIPAA

-- Audit logs table (HIPAA compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Event Information
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    request_id UUID,
    http_method VARCHAR(10),
    request_path TEXT,
    request_body JSONB,
    
    -- Response Information
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    
    -- PHI Access Tracking
    phi_accessed BOOLEAN DEFAULT false,
    phi_fields_accessed JSONB,
    access_reason TEXT,
    
    -- Change Tracking
    data_before_change JSONB,
    data_after_change JSONB,
    
    -- Metadata
    success BOOLEAN DEFAULT true,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for compliance reporting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_phi ON audit_logs(phi_accessed) WHERE phi_accessed = true;
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);

-- Crisis alerts table
CREATE TABLE IF NOT EXISTS crisis_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert Details
    severity crisis_severity NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    indicators JSONB NOT NULL,
    risk_score INTEGER,
    
    -- Response Information
    responder_id UUID REFERENCES users(id),
    response_time INTERVAL,
    response_notes_encrypted BYTEA,
    
    -- Escalation
    escalated BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    escalated_to VARCHAR(100), -- '911', 'crisis_team', 'therapist', etc.
    escalated_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes_encrypted BYTEA,
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Emergency Contacts Notified
    contacts_notified JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crisis_alerts_user ON crisis_alerts(user_id);
CREATE INDEX idx_crisis_alerts_status ON crisis_alerts(status);
CREATE INDEX idx_crisis_alerts_severity ON crisis_alerts(severity);
CREATE INDEX idx_crisis_alerts_created ON crisis_alerts(created_at DESC);

-- Crisis detections table (ML detection history)
CREATE TABLE IF NOT EXISTS crisis_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Detection Details
    severity VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2),
    indicators JSONB NOT NULL,
    ml_model_version VARCHAR(50),
    
    -- Source
    source_type VARCHAR(50), -- 'text', 'mood', 'behavior_pattern', etc.
    source_content TEXT,
    
    -- Action Taken
    alert_created BOOLEAN DEFAULT false,
    alert_id UUID REFERENCES crisis_alerts(id),
    auto_intervention BOOLEAN DEFAULT false,
    
    -- Metadata
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crisis_detections_user ON crisis_detections(user_id);
CREATE INDEX idx_crisis_detections_severity ON crisis_detections(severity);
CREATE INDEX idx_crisis_detections_detected ON crisis_detections(detected_at DESC);

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact Information (encrypted)
    name_encrypted BYTEA NOT NULL,
    phone_encrypted BYTEA NOT NULL,
    email_encrypted BYTEA,
    relationship VARCHAR(100),
    contact_type contact_type NOT NULL,
    
    -- Preferences
    priority_order INTEGER DEFAULT 1,
    available_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
    preferred_contact_method VARCHAR(50) DEFAULT 'phone',
    
    -- Permissions
    can_access_mood_data BOOLEAN DEFAULT false,
    can_access_crisis_alerts BOOLEAN DEFAULT true,
    can_schedule_appointments BOOLEAN DEFAULT false,
    
    -- Notification History
    last_notified_at TIMESTAMP WITH TIME ZONE,
    notification_count INTEGER DEFAULT 0,
    
    -- Metadata
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_contacts_type ON emergency_contacts(contact_type);
CREATE INDEX idx_emergency_contacts_priority ON emergency_contacts(user_id, priority_order);

-- Therapy sessions table
CREATE TABLE IF NOT EXISTS therapy_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    
    -- Session Details
    type session_type NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_duration_minutes INTEGER DEFAULT 50,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Clinical Notes (encrypted)
    session_notes_encrypted BYTEA,
    treatment_goals_encrypted BYTEA,
    interventions_used JSONB,
    homework_assigned_encrypted BYTEA,
    
    -- Progress Tracking
    progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 10),
    patient_engagement_level INTEGER CHECK (patient_engagement_level >= 1 AND patient_engagement_level <= 10),
    
    -- Risk Assessment
    risk_assessment_completed BOOLEAN DEFAULT false,
    suicide_risk_level VARCHAR(50),
    self_harm_risk_level VARCHAR(50),
    violence_risk_level VARCHAR(50),
    safety_plan_reviewed BOOLEAN DEFAULT false,
    
    -- Billing
    billed BOOLEAN DEFAULT false,
    billing_code VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_therapy_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX idx_therapy_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX idx_therapy_sessions_scheduled ON therapy_sessions(scheduled_start);
CREATE INDEX idx_therapy_sessions_status ON therapy_sessions(status);

-- Emergency interventions table
CREATE TABLE IF NOT EXISTS emergency_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID REFERENCES users(id),
    crisis_alert_id UUID REFERENCES crisis_alerts(id),
    
    -- Intervention Details
    intervention_type VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Actions Taken
    emergency_services_called BOOLEAN DEFAULT false,
    welfare_check_requested BOOLEAN DEFAULT false,
    involuntary_hold_initiated BOOLEAN DEFAULT false,
    
    -- Contacts
    contacts_notified JSONB DEFAULT '[]'::jsonb,
    
    -- Outcome
    outcome TEXT,
    follow_up_plan TEXT,
    
    -- Metadata
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_emergency_interventions_patient ON emergency_interventions(patient_id);
CREATE INDEX idx_emergency_interventions_therapist ON emergency_interventions(therapist_id);
CREATE INDEX idx_emergency_interventions_initiated ON emergency_interventions(initiated_at DESC);

-- Add migration record
INSERT INTO migrations (name, executed_at) 
VALUES ('002_add_audit_tables', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;