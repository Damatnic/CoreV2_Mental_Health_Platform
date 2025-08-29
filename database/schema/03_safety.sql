-- CoreV2 Mental Health Platform - Safety & Crisis Schema
-- Version: 1.0.0
-- Created: 2025-08-14

-- Safety plans - Personalized crisis prevention plans
CREATE TABLE IF NOT EXISTS safety_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'My Safety Plan',
  
  -- Warning signs
  warning_signs TEXT[],
  warning_signs_notes TEXT,
  
  -- Coping strategies
  internal_coping_strategies TEXT[],
  distraction_activities TEXT[],
  
  -- Social support
  social_distractions JSONB DEFAULT '[]'::jsonb, -- People and places for distraction
  support_contacts JSONB DEFAULT '[]'::jsonb, -- Friends/family for support
  
  -- Professional support
  professional_contacts JSONB DEFAULT '[]'::jsonb,
  crisis_hotlines JSONB DEFAULT '[]'::jsonb,
  
  -- Safety measures
  safe_environment_steps TEXT[],
  reasons_for_living TEXT[],
  
  -- Additional resources
  helpful_resources TEXT[],
  personal_strengths TEXT[],
  calming_activities TEXT[],
  safe_places TEXT[],
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_shared_with_therapist BOOLEAN DEFAULT false,
  therapist_id UUID REFERENCES users(id),
  last_reviewed DATE,
  review_reminder_days INTEGER DEFAULT 30,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safety plan activations - Track when safety plan is accessed
CREATE TABLE IF NOT EXISTS safety_plan_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  safety_plan_id UUID REFERENCES safety_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trigger_reason TEXT,
  severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 10),
  strategies_used TEXT[],
  contacts_reached TEXT[],
  outcome VARCHAR(100),
  notes TEXT,
  duration_minutes INTEGER,
  was_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crisis resources - Global crisis resources database
CREATE TABLE IF NOT EXISTS crisis_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  phone VARCHAR(50),
  text_number VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  chat_url VARCHAR(500),
  description TEXT,
  services_provided TEXT[],
  languages TEXT[],
  country VARCHAR(2),
  state_province VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(50),
  hours_of_operation JSONB,
  is_24_7 BOOLEAN DEFAULT false,
  category VARCHAR(100), -- crisis, substance, domestic_violence, lgbtq, veterans, etc.
  subcategory VARCHAR(100),
  age_groups TEXT[], -- children, teens, adults, seniors
  accessibility_features TEXT[],
  cost VARCHAR(50) DEFAULT 'free',
  is_verified BOOLEAN DEFAULT false,
  verification_date DATE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crisis assessments - Track crisis risk assessments
CREATE TABLE IF NOT EXISTS crisis_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_type VARCHAR(100), -- PHQ-9, GAD-7, crisis_screening, etc.
  
  -- Risk indicators
  suicidal_ideation BOOLEAN DEFAULT false,
  self_harm_thoughts BOOLEAN DEFAULT false,
  harm_to_others_thoughts BOOLEAN DEFAULT false,
  substance_use_concern BOOLEAN DEFAULT false,
  
  -- Scores and levels
  total_score INTEGER,
  risk_level VARCHAR(50) CHECK (risk_level IN ('none', 'low', 'moderate', 'high', 'severe')),
  
  -- Detailed responses
  questions JSONB,
  answers JSONB,
  
  -- Actions taken
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  resources_provided TEXT[],
  helper_notified BOOLEAN DEFAULT false,
  emergency_contact_notified BOOLEAN DEFAULT false,
  
  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crisis interventions - Log of crisis interventions
CREATE TABLE IF NOT EXISTS crisis_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES users(id),
  assessment_id UUID REFERENCES crisis_assessments(id),
  
  -- Intervention details
  intervention_type VARCHAR(100), -- chat, call, in_person, emergency_services
  severity_level VARCHAR(50),
  presenting_issues TEXT[],
  
  -- Risk assessment
  immediate_danger BOOLEAN DEFAULT false,
  has_plan BOOLEAN DEFAULT false,
  has_means BOOLEAN DEFAULT false,
  has_timeline BOOLEAN DEFAULT false,
  
  -- Actions taken
  actions_taken TEXT[],
  de_escalation_techniques TEXT[],
  safety_plan_reviewed BOOLEAN DEFAULT false,
  safety_plan_updated BOOLEAN DEFAULT false,
  
  -- Referrals and resources
  referrals_made JSONB DEFAULT '[]'::jsonb,
  resources_provided TEXT[],
  emergency_services_contacted BOOLEAN DEFAULT false,
  
  -- Outcome
  outcome VARCHAR(100),
  risk_level_after VARCHAR(50),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Documentation
  session_notes TEXT,
  duration_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Crisis keywords - For automated detection
CREATE TABLE IF NOT EXISTS crisis_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  phrase TEXT,
  category VARCHAR(100), -- suicide, self_harm, violence, substance, etc.
  severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
  context_required BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  cultural_context VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crisis detection logs - Track automated crisis detection
CREATE TABLE IF NOT EXISTS crisis_detection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50), -- chat, journal, mood_entry, etc.
  content_id UUID,
  detected_keywords TEXT[],
  confidence_score DECIMAL(3, 2), -- 0 to 1
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  false_positive BOOLEAN,
  action_taken VARCHAR(100),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts - User's personal emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  notify_in_crisis BOOLEAN DEFAULT true,
  can_view_safety_plan BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wellness check requests - Scheduled or requested wellness checks
CREATE TABLE IF NOT EXISTS wellness_check_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id),
  check_type VARCHAR(50), -- automated, peer_requested, helper_requested, self_scheduled
  reason TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),
  outcome VARCHAR(100),
  notes TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safe space sessions - Temporary safe communication spaces
CREATE TABLE IF NOT EXISTS safe_space_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES users(id),
  session_code VARCHAR(20) UNIQUE,
  session_type VARCHAR(50), -- crisis, support, peer, guided
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  transcript JSONB, -- Encrypted chat transcript if consent given
  outcome VARCHAR(100),
  follow_up_scheduled BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_safety_plans_user_id ON safety_plans(user_id);
CREATE INDEX idx_safety_plans_is_active ON safety_plans(is_active);

CREATE INDEX idx_safety_plan_activations_user_id ON safety_plan_activations(user_id);
CREATE INDEX idx_safety_plan_activations_created_at ON safety_plan_activations(created_at DESC);

CREATE INDEX idx_crisis_resources_country ON crisis_resources(country);
CREATE INDEX idx_crisis_resources_category ON crisis_resources(category);
CREATE INDEX idx_crisis_resources_is_24_7 ON crisis_resources(is_24_7);
CREATE INDEX idx_crisis_resources_is_active ON crisis_resources(is_active);

CREATE INDEX idx_crisis_assessments_user_id ON crisis_assessments(user_id);
CREATE INDEX idx_crisis_assessments_risk_level ON crisis_assessments(risk_level);
CREATE INDEX idx_crisis_assessments_created_at ON crisis_assessments(created_at DESC);

CREATE INDEX idx_crisis_interventions_user_id ON crisis_interventions(user_id);
CREATE INDEX idx_crisis_interventions_helper_id ON crisis_interventions(helper_id);
CREATE INDEX idx_crisis_interventions_created_at ON crisis_interventions(created_at DESC);

CREATE INDEX idx_crisis_detection_logs_user_id ON crisis_detection_logs(user_id);
CREATE INDEX idx_crisis_detection_logs_risk_score ON crisis_detection_logs(risk_score);
CREATE INDEX idx_crisis_detection_logs_created_at ON crisis_detection_logs(created_at DESC);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

CREATE INDEX idx_wellness_check_requests_user_id ON wellness_check_requests(user_id);
CREATE INDEX idx_wellness_check_requests_scheduled_time ON wellness_check_requests(scheduled_time);

CREATE INDEX idx_safe_space_sessions_user_id ON safe_space_sessions(user_id);
CREATE INDEX idx_safe_space_sessions_session_code ON safe_space_sessions(session_code);
CREATE INDEX idx_safe_space_sessions_status ON safe_space_sessions(status);

-- Create update triggers
CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crisis_resources_updated_at BEFORE UPDATE ON crisis_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plan_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_check_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_space_sessions ENABLE ROW LEVEL SECURITY;

-- Insert default crisis resources
INSERT INTO crisis_resources (name, phone, text_number, website, description, category, is_24_7, priority, country) VALUES
('988 Suicide & Crisis Lifeline', '988', '988', 'https://988lifeline.org', 'Free, confidential crisis support 24/7', 'crisis', true, 1, 'US'),
('Crisis Text Line', NULL, '741741', 'https://www.crisistextline.org', 'Text HOME to connect with a crisis counselor', 'crisis', true, 2, 'US'),
('SAMHSA National Helpline', '1-800-662-4357', NULL, 'https://www.samhsa.gov/find-help/national-helpline', 'Treatment referral and information service', 'substance', true, 3, 'US'),
('NAMI HelpLine', '1-800-950-6264', NULL, 'https://www.nami.org/help', 'Monday-Friday 10am-10pm ET', 'mental_health', false, 4, 'US'),
('Veterans Crisis Line', '988', '838255', 'https://www.veteranscrisisline.net', 'Press 1 after calling 988', 'veterans', true, 5, 'US'),
('Trevor Lifeline', '1-866-488-7386', '678678', 'https://www.thetrevorproject.org', 'LGBTQ youth crisis support', 'lgbtq', true, 6, 'US'),
('National Domestic Violence Hotline', '1-800-799-7233', '88788', 'https://www.thehotline.org', 'Text START to 88788', 'domestic_violence', true, 7, 'US'),
('RAINN National Sexual Assault Hotline', '1-800-656-4673', NULL, 'https://www.rainn.org', 'Confidential support for survivors', 'sexual_assault', true, 8, 'US'),
('National Eating Disorders Association', '1-800-931-2237', '741741', 'https://www.nationaleatingdisorders.org', 'Text NEDA to 741741', 'eating_disorders', false, 9, 'US'),
('Trans Lifeline', '877-565-8860', NULL, 'https://translifeline.org', 'Peer support for trans community', 'lgbtq', true, 10, 'US')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE safety_plans IS 'Personalized crisis prevention and safety plans';
COMMENT ON TABLE crisis_resources IS 'Global database of crisis support resources';
COMMENT ON TABLE crisis_assessments IS 'Crisis risk assessment records';
COMMENT ON TABLE crisis_interventions IS 'Documentation of crisis intervention sessions';
COMMENT ON TABLE emergency_contacts IS 'User personal emergency contact information';
COMMENT ON TABLE safe_space_sessions IS 'Temporary safe communication sessions for crisis support';