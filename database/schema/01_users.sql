-- CoreV2 Mental Health Platform - Users Schema
-- Version: 1.0.0
-- Created: 2025-08-14

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (backup if bcrypt not available)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table - Core authentication and identification
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  auth0_id VARCHAR(255) UNIQUE, -- For Auth0 integration
  password_hash VARCHAR(255), -- For local auth (optional)
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'helper', 'admin', 'moderator')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles - Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  date_of_birth DATE,
  gender VARCHAR(50),
  pronouns VARCHAR(50),
  country VARCHAR(2),
  state_province VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  medical_info JSONB, -- Encrypted sensitive medical information
  preferences JSONB DEFAULT '{}'::jsonb,
  privacy_settings JSONB DEFAULT '{
    "profile_visibility": "private",
    "show_online_status": false,
    "allow_messages": "friends",
    "share_mood_data": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- User preferences - Detailed app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light',
  color_scheme VARCHAR(50) DEFAULT 'default',
  font_size VARCHAR(20) DEFAULT 'medium',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications JSONB DEFAULT '{
    "weekly_summary": true,
    "mood_reminders": true,
    "crisis_alerts": false,
    "new_messages": true,
    "community_updates": false
  }'::jsonb,
  push_notifications JSONB DEFAULT '{
    "mood_check_in": true,
    "medication_reminders": false,
    "appointment_reminders": false,
    "crisis_support": true,
    "peer_messages": true
  }'::jsonb,
  accessibility_settings JSONB DEFAULT '{
    "high_contrast": false,
    "reduce_motion": false,
    "screen_reader": false,
    "keyboard_navigation": false,
    "font_size_multiplier": 1.0
  }'::jsonb,
  wellness_goals JSONB DEFAULT '[]'::jsonb,
  reminder_times JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Helper profiles - For certified helpers/counselors
CREATE TABLE IF NOT EXISTS helper_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  certification_type VARCHAR(100),
  certification_number VARCHAR(100),
  certification_expiry DATE,
  specializations TEXT[],
  languages TEXT[],
  availability_schedule JSONB,
  hourly_rate DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  bio TEXT,
  approach_description TEXT,
  years_experience INTEGER,
  education JSONB,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  total_hours DECIMAL(10, 2) DEFAULT 0.00,
  accepts_insurance BOOLEAN DEFAULT false,
  insurance_providers TEXT[],
  sliding_scale BOOLEAN DEFAULT false,
  pro_bono_slots INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- User sessions - Track user login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User relationships (for peer support connections)
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('friend', 'blocked', 'support_buddy', 'helper')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, related_user_id),
  CHECK (user_id != related_user_id)
);

-- Audit log for user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_country ON user_profiles(country);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX idx_helper_profiles_user_id ON helper_profiles(user_id);
CREATE INDEX idx_helper_profiles_is_verified ON helper_profiles(is_verified);
CREATE INDEX idx_helper_profiles_rating ON helper_profiles(rating);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_user_relationships_user_id ON user_relationships(user_id);
CREATE INDEX idx_user_relationships_related_user_id ON user_relationships(related_user_id);
CREATE INDEX idx_user_relationships_status ON user_relationships(status);

CREATE INDEX idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX idx_user_audit_log_created_at ON user_audit_log(created_at);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_profiles_updated_at BEFORE UPDATE ON helper_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_relationships_updated_at BEFORE UPDATE ON user_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data (expand as needed)
CREATE POLICY users_select_own ON users FOR SELECT USING (id = current_setting('app.current_user_id')::UUID);
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = current_setting('app.current_user_id')::UUID);

CREATE POLICY user_profiles_select_own ON user_profiles FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_profiles_update_own ON user_profiles FOR UPDATE USING (user_id = current_setting('app.current_user_id')::UUID);

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user authentication and identification table';
COMMENT ON TABLE user_profiles IS 'Extended user profile information including emergency contacts';
COMMENT ON TABLE user_preferences IS 'User application preferences and settings';
COMMENT ON TABLE helper_profiles IS 'Professional helper/counselor profiles and credentials';
COMMENT ON TABLE user_sessions IS 'Active user login sessions for security tracking';
COMMENT ON TABLE user_relationships IS 'User connections for peer support and blocking';
COMMENT ON TABLE user_audit_log IS 'Audit trail of user actions for compliance and security';