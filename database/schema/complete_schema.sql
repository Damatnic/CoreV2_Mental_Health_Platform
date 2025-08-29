-- AstralCore V4 - Complete Mental Health Platform Database Schema
-- CRISIS-FIRST mental health support system
-- Created for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Drop existing tables in correct order (for clean reinstall)
DROP TABLE IF EXISTS crisis_escalation_logs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS crisis_events CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS safety_plans CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS helper_profiles CASCADE;
DROP TABLE IF EXISTS user_relationships CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

-- Core users table with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('admin', 'therapist', 'helper', 'user')) DEFAULT 'user',
  username TEXT UNIQUE,
  auth_provider TEXT CHECK (auth_provider IN ('email', 'google', 'anonymous')) DEFAULT 'anonymous',
  auth_provider_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either email or anonymous access
  CONSTRAINT users_auth_check CHECK (
    (is_anonymous = true AND email IS NULL) OR 
    (is_anonymous = false AND email IS NOT NULL)
  )
);

-- User profiles with privacy-first design
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  date_of_birth DATE,
  
  -- Mental health specific fields
  mental_health_goals TEXT[],
  crisis_keywords TEXT[], -- Personal crisis trigger words
  preferred_intervention_style TEXT CHECK (preferred_intervention_style IN ('gentle', 'direct', 'clinical', 'peer')),
  
  -- Privacy settings
  privacy_level TEXT CHECK (privacy_level IN ('private', 'community', 'helpers_only')) DEFAULT 'private',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User preferences for app customization
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- UI preferences
  theme TEXT CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'auto',
  high_contrast BOOLEAN DEFAULT false,
  reduce_motion BOOLEAN DEFAULT false,
  font_size TEXT CHECK (font_size IN ('small', 'medium', 'large', 'xl')) DEFAULT 'medium',
  
  -- Notification preferences
  crisis_notifications BOOLEAN DEFAULT true,
  mood_reminders BOOLEAN DEFAULT true,
  daily_check_ins BOOLEAN DEFAULT false,
  peer_messages BOOLEAN DEFAULT true,
  
  -- Crisis preferences
  quick_exit_enabled BOOLEAN DEFAULT true,
  panic_button_visible BOOLEAN DEFAULT true,
  auto_crisis_detection BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- =============================================================================
-- CRISIS MANAGEMENT
-- =============================================================================

-- Crisis events with detailed tracking
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Crisis details
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  trigger_type TEXT CHECK (trigger_type IN ('keyword', 'behavioral', 'manual', 'ai_detected', 'panic_button')),
  detected_keywords TEXT[],
  confidence_score DECIMAL(3,2), -- AI confidence 0.00 to 1.00
  
  -- Response tracking
  intervention_type TEXT CHECK (intervention_type IN ('breathing', 'grounding', 'safety_plan', 'emergency_contact', 'hotline', 'professional')),
  response_time_seconds INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_method TEXT,
  
  -- Context
  location_context JSONB, -- General location (city/state) for resource matching
  device_context JSONB, -- Device type, browser for UX optimization
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Safety plans for crisis prevention
CREATE TABLE safety_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Safety plan content (encrypted client-side)
  warning_signs TEXT[],
  coping_strategies TEXT[],
  social_supports TEXT[], -- Encrypted contact info
  environmental_safety JSONB, -- Safe spaces, items to remove
  
  -- Professional supports
  professional_contacts JSONB, -- Encrypted therapist/doctor info
  crisis_contacts JSONB, -- Encrypted emergency contacts
  
  -- Plan metadata
  is_active BOOLEAN DEFAULT true,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id) -- One active plan per user
);

-- Emergency contacts with privacy protection
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contact details (encrypted)
  name TEXT NOT NULL,
  relationship TEXT,
  phone_number TEXT, -- Encrypted
  email TEXT, -- Encrypted
  
  -- Contact preferences
  contact_method TEXT CHECK (contact_method IN ('phone', 'text', 'email')) DEFAULT 'phone',
  crisis_only BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 1,
  
  -- Availability
  availability_schedule JSONB, -- When they're available
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis escalation tracking
CREATE TABLE crisis_escalation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Escalation details
  escalation_step TEXT CHECK (escalation_step IN ('ai_response', 'breathing_exercise', 'safety_plan', 'peer_support', 'crisis_counselor', 'emergency_services')),
  escalation_trigger TEXT,
  automated BOOLEAN DEFAULT true,
  
  -- Response tracking
  response_time_seconds INTEGER,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  user_feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- WELLNESS TRACKING
-- =============================================================================

-- Mood entries for wellness monitoring
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mood data
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10) NOT NULL,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  
  -- Contextual information
  triggers TEXT[],
  activities TEXT[],
  notes TEXT, -- Client-side encrypted
  
  -- Environmental factors
  weather TEXT,
  social_interaction BOOLEAN,
  exercise BOOLEAN,
  medication_taken BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AI CHAT SYSTEM
-- =============================================================================

-- Chat conversations and messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  
  -- Message content
  message_content TEXT NOT NULL, -- Encrypted client-side
  is_ai_message BOOLEAN DEFAULT false,
  ai_model TEXT, -- gpt-4, claude-3, etc.
  
  -- Crisis analysis
  crisis_keywords_detected TEXT[],
  crisis_confidence_score DECIMAL(3,2),
  intervention_triggered BOOLEAN DEFAULT false,
  
  -- Message metadata
  tokens_used INTEGER,
  response_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMMUNITY & PEER SUPPORT
-- =============================================================================

-- Helper/therapist profiles
CREATE TABLE helper_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Credentials
  license_type TEXT,
  license_number TEXT, -- Encrypted
  license_state TEXT,
  certification_body TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Professional details
  specializations TEXT[],
  experience_years INTEGER,
  education JSONB,
  approach_methods TEXT[],
  
  -- Availability
  available_for_crisis BOOLEAN DEFAULT false,
  max_concurrent_clients INTEGER DEFAULT 5,
  response_time_target INTEGER, -- In minutes
  
  -- Performance metrics
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  total_sessions INTEGER DEFAULT 0,
  crisis_interventions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User relationships for peer support
CREATE TABLE user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  relationship_type TEXT CHECK (relationship_type IN ('peer_support', 'crisis_buddy', 'blocked', 'helper_client')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'inactive', 'blocked')) DEFAULT 'pending',
  
  -- Support relationship details
  support_focus TEXT[], -- Areas of mutual support
  crisis_support_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, related_user_id),
  CHECK (user_id != related_user_id)
);

-- =============================================================================
-- ANALYTICS & MONITORING
-- =============================================================================

-- Privacy-first analytics
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage analytics (anonymized)
  feature_used TEXT NOT NULL,
  session_duration INTEGER,
  interaction_count INTEGER,
  
  -- Crisis analytics
  crisis_prevented_count INTEGER DEFAULT 0,
  safety_plan_accessed_count INTEGER DEFAULT 0,
  breathing_exercises_used INTEGER DEFAULT 0,
  
  -- Performance metrics
  page_load_time INTEGER,
  ai_response_time INTEGER,
  
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification tracking
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  notification_type TEXT CHECK (notification_type IN ('crisis_alert', 'mood_reminder', 'check_in', 'peer_message', 'system')) NOT NULL,
  delivery_method TEXT CHECK (delivery_method IN ('push', 'email', 'in_app')) NOT NULL,
  
  -- Delivery status
  status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'dismissed')) DEFAULT 'sent',
  opened BOOLEAN DEFAULT false,
  action_taken BOOLEAN DEFAULT false,
  
  -- Content (encrypted)
  title TEXT,
  message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for security
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  
  -- Session metadata
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Security
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_anonymous ON users(is_anonymous);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Crisis events indexes
CREATE INDEX idx_crisis_events_user_id ON crisis_events(user_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at);
CREATE INDEX idx_crisis_events_resolved ON crisis_events(resolved);
CREATE INDEX idx_crisis_events_trigger_type ON crisis_events(trigger_type);

-- Mood entries indexes
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_mood_entries_mood_score ON mood_entries(mood_score);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_crisis_confidence ON chat_messages(crisis_confidence_score);

-- Safety plans indexes
CREATE INDEX idx_safety_plans_user_id ON safety_plans(user_id);
CREATE INDEX idx_safety_plans_is_active ON safety_plans(is_active);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);
CREATE INDEX idx_user_analytics_feature_used ON user_analytics(feature_used);

-- Full-text search indexes
CREATE INDEX idx_crisis_keywords_gin ON crisis_events USING gin(detected_keywords);
CREATE INDEX idx_mood_triggers_gin ON mood_entries USING gin(triggers);
CREATE INDEX idx_chat_content_gin ON chat_messages USING gin(to_tsvector('english', message_content));

-- =============================================================================
-- TRIGGERS FOR AUTOMATED UPDATES
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON safety_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_profiles_updated_at BEFORE UPDATE ON helper_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crisis auto-escalation trigger
CREATE OR REPLACE FUNCTION auto_escalate_crisis()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-escalate critical crises
    IF NEW.severity = 'critical' AND NOT NEW.resolved THEN
        INSERT INTO crisis_escalation_logs (
            crisis_event_id,
            user_id,
            escalation_step,
            escalation_trigger,
            automated
        ) VALUES (
            NEW.id,
            NEW.user_id,
            'crisis_counselor',
            'auto_critical_escalation',
            true
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_escalate_crisis_trigger
    AFTER INSERT ON crisis_events
    FOR EACH ROW EXECUTE FUNCTION auto_escalate_crisis();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (own data only)
CREATE POLICY users_select_own ON users 
FOR SELECT USING (auth.uid() = id OR role IN ('admin', 'therapist'));

CREATE POLICY users_update_own ON users 
FOR UPDATE USING (auth.uid() = id);

-- Crisis events policies
CREATE POLICY crisis_events_select_own ON crisis_events 
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'therapist', 'helper')
));

CREATE POLICY crisis_events_insert_own ON crisis_events 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mood entries policies
CREATE POLICY mood_entries_select_own ON mood_entries 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY mood_entries_insert_own ON mood_entries 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Safety plans policies (most private)
CREATE POLICY safety_plans_own_only ON safety_plans 
FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY chat_messages_own_only ON chat_messages 
FOR ALL USING (auth.uid() = user_id);

-- Helper access to crisis data (with user consent)
CREATE POLICY helpers_crisis_access ON crisis_events 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_relationships ur
        JOIN users u ON u.id = auth.uid()
        WHERE ur.user_id = crisis_events.user_id
        AND ur.related_user_id = auth.uid()
        AND ur.relationship_type = 'helper_client'
        AND ur.status = 'active'
        AND u.role IN ('helper', 'therapist')
    )
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- User context functions for RLS
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
END;
$$ LANGUAGE plpgsql;

-- Crisis detection helper
CREATE OR REPLACE FUNCTION detect_crisis_keywords(content TEXT)
RETURNS TABLE(keywords TEXT[], confidence DECIMAL) AS $$
DECLARE
    crisis_words TEXT[] := ARRAY['suicide', 'kill myself', 'end it all', 'no point', 'hopeless', 'can''t go on'];
    detected TEXT[] := '{}';
    word TEXT;
    conf DECIMAL := 0.0;
BEGIN
    FOREACH word IN ARRAY crisis_words
    LOOP
        IF content ILIKE '%' || word || '%' THEN
            detected := array_append(detected, word);
            conf := conf + 0.2;
        END IF;
    END LOOP;
    
    -- Cap confidence at 1.0
    conf := LEAST(conf, 1.0);
    
    RETURN QUERY SELECT detected, conf;
END;
$$ LANGUAGE plpgsql;

-- Mood trend analysis
CREATE OR REPLACE FUNCTION get_mood_trend(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE(
    avg_mood DECIMAL,
    trend_direction TEXT,
    crisis_risk TEXT
) AS $$
DECLARE
    recent_avg DECIMAL;
    older_avg DECIMAL;
    trend TEXT;
    risk TEXT;
BEGIN
    -- Calculate recent average (last 7 days)
    SELECT AVG(mood_score) INTO recent_avg
    FROM mood_entries 
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Calculate older average (7-14 days ago)
    SELECT AVG(mood_score) INTO older_avg
    FROM mood_entries 
    WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '14 days'
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Determine trend
    IF recent_avg > older_avg + 1 THEN
        trend := 'improving';
    ELSIF recent_avg < older_avg - 1 THEN
        trend := 'declining';
    ELSE
        trend := 'stable';
    END IF;
    
    -- Assess crisis risk
    IF recent_avg <= 3 THEN
        risk := 'high';
    ELSIF recent_avg <= 5 THEN
        risk := 'medium';
    ELSE
        risk := 'low';
    END IF;
    
    RETURN QUERY SELECT recent_avg, trend, risk;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE users IS 'Core user authentication with anonymous and authenticated modes';
COMMENT ON TABLE crisis_events IS 'Crisis detection and intervention tracking with AI analysis';
COMMENT ON TABLE mood_entries IS 'Daily mood tracking for wellness monitoring';
COMMENT ON TABLE safety_plans IS 'Personalized crisis prevention and intervention plans';
COMMENT ON TABLE chat_messages IS 'AI therapeutic chat with crisis detection';
COMMENT ON TABLE helper_profiles IS 'Licensed mental health professionals and peer supporters';
COMMENT ON TABLE user_analytics IS 'Privacy-first usage analytics for platform improvement';

COMMENT ON COLUMN crisis_events.severity IS 'Crisis severity: low (mild distress) to critical (immediate danger)';
COMMENT ON COLUMN crisis_events.confidence_score IS 'AI confidence in crisis detection (0.00-1.00)';
COMMENT ON COLUMN mood_entries.mood_score IS 'Daily mood rating 1 (very low) to 10 (excellent)';
COMMENT ON COLUMN safety_plans.warning_signs IS 'Personal early warning signs of crisis';
COMMENT ON COLUMN chat_messages.crisis_confidence_score IS 'AI confidence of crisis indicators in message';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Database setup complete
SELECT 'AstralCore V4 Database Schema Created Successfully' as status;