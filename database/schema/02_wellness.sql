-- CoreV2 Mental Health Platform - Wellness Schema
-- Version: 1.0.0
-- Created: 2025-08-14

-- Mood entries - Track user mood over time
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_label VARCHAR(50),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_hours DECIMAL(3, 1),
  physical_activity INTEGER CHECK (physical_activity >= 0 AND physical_activity <= 300), -- minutes
  notes TEXT,
  triggers TEXT[],
  tags TEXT[],
  weather VARCHAR(50),
  location JSONB,
  is_crisis BOOLEAN DEFAULT false,
  crisis_handled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wellness check-ins - Comprehensive daily check-ins
CREATE TABLE IF NOT EXISTS wellness_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  morning_mood INTEGER CHECK (morning_mood >= 1 AND morning_mood <= 10),
  afternoon_mood INTEGER CHECK (afternoon_mood >= 1 AND afternoon_mood <= 10),
  evening_mood INTEGER CHECK (evening_mood >= 1 AND evening_mood <= 10),
  gratitude_entries TEXT[],
  accomplishments TEXT[],
  challenges TEXT[],
  self_care_activities TEXT[],
  social_interactions INTEGER DEFAULT 0,
  outdoor_time INTEGER DEFAULT 0, -- minutes
  screen_time INTEGER DEFAULT 0, -- minutes
  water_intake INTEGER DEFAULT 0, -- glasses
  meals_eaten INTEGER DEFAULT 0,
  medication_taken BOOLEAN DEFAULT false,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_date)
);

-- Journal entries - Private journaling
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  emotion_tags TEXT[],
  is_private BOOLEAN DEFAULT true,
  is_therapist_shared BOOLEAN DEFAULT false,
  therapist_notes TEXT,
  prompt_id UUID, -- Reference to journal prompts if used
  word_count INTEGER,
  sentiment_score DECIMAL(3, 2), -- -1 to 1 sentiment analysis score
  tags TEXT[],
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal prompts - Suggested prompts for journaling
CREATE TABLE IF NOT EXISTS journal_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100),
  prompt_text TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  therapeutic_focus VARCHAR(100),
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habits tracking
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_frequency VARCHAR(50), -- daily, weekly, monthly
  target_count INTEGER DEFAULT 1,
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50),
  reminder_time TIME,
  reminder_days INTEGER[], -- 0-6 for Sunday-Saturday
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habit completions
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id, completed_date)
);

-- Habit streaks tracking
CREATE TABLE IF NOT EXISTS habit_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  streak_start_date DATE,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id)
);

-- Meditation sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(100), -- guided, unguided, breathing, body-scan
  duration_seconds INTEGER NOT NULL,
  guide_id UUID, -- Reference to meditation guide if used
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meditation guides
CREATE TABLE IF NOT EXISTS meditation_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL,
  category VARCHAR(100),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  audio_url TEXT,
  transcript TEXT,
  instructor_name VARCHAR(255),
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Breathing exercises
CREATE TABLE IF NOT EXISTS breathing_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  inhale_seconds INTEGER NOT NULL,
  hold_seconds INTEGER NOT NULL,
  exhale_seconds INTEGER NOT NULL,
  cycles INTEGER DEFAULT 10,
  category VARCHAR(100),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  benefits TEXT[],
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Breathing exercise sessions
CREATE TABLE IF NOT EXISTS breathing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES breathing_exercises(id),
  duration_seconds INTEGER NOT NULL,
  cycles_completed INTEGER,
  stress_before INTEGER CHECK (stress_before >= 1 AND stress_before <= 10),
  stress_after INTEGER CHECK (stress_after >= 1 AND stress_after <= 10),
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wellness goals
CREATE TABLE IF NOT EXISTS wellness_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_value DECIMAL(10, 2),
  target_unit VARCHAR(50),
  target_date DATE,
  current_value DECIMAL(10, 2) DEFAULT 0,
  progress_percentage DECIMAL(5, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Wellness insights (AI-generated or calculated)
CREATE TABLE IF NOT EXISTS wellness_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(100), -- mood_trend, sleep_pattern, habit_correlation
  insight_text TEXT NOT NULL,
  data_points JSONB,
  confidence_score DECIMAL(3, 2), -- 0 to 1
  time_period_start DATE,
  time_period_end DATE,
  recommendations TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affirmations
CREATE TABLE IF NOT EXISTS affirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category VARCHAR(100),
  author VARCHAR(255),
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User affirmation preferences
CREATE TABLE IF NOT EXISTS user_affirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affirmation_id UUID REFERENCES affirmations(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  last_shown TIMESTAMP WITH TIME ZONE,
  shown_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, affirmation_id)
);

-- Create indexes for better performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at DESC);
CREATE INDEX idx_mood_entries_is_crisis ON mood_entries(is_crisis) WHERE is_crisis = true;

CREATE INDEX idx_wellness_checkins_user_id ON wellness_checkins(user_id);
CREATE INDEX idx_wellness_checkins_date ON wellness_checkins(checkin_date DESC);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_is_private ON journal_entries(is_private);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_date DESC);
CREATE INDEX idx_habit_streaks_habit_id ON habit_streaks(habit_id);

CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_breathing_sessions_user_id ON breathing_sessions(user_id);

CREATE INDEX idx_wellness_goals_user_id ON wellness_goals(user_id);
CREATE INDEX idx_wellness_goals_status ON wellness_goals(status);

CREATE INDEX idx_wellness_insights_user_id ON wellness_insights(user_id);
CREATE INDEX idx_wellness_insights_created_at ON wellness_insights(created_at DESC);
CREATE INDEX idx_wellness_insights_is_read ON wellness_insights(is_read);

-- Create update triggers
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_checkins_updated_at BEFORE UPDATE ON wellness_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_streaks_updated_at BEFORE UPDATE ON habit_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_goals_updated_at BEFORE UPDATE ON wellness_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_insights ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE mood_entries IS 'User mood tracking entries with comprehensive emotional data';
COMMENT ON TABLE wellness_checkins IS 'Daily comprehensive wellness check-ins';
COMMENT ON TABLE journal_entries IS 'Private journal entries with sentiment analysis';
COMMENT ON TABLE habits IS 'User-defined habits for tracking';
COMMENT ON TABLE habit_completions IS 'Daily habit completion records';
COMMENT ON TABLE meditation_sessions IS 'Meditation practice session records';
COMMENT ON TABLE wellness_goals IS 'User wellness goals and progress tracking';
COMMENT ON TABLE wellness_insights IS 'AI-generated or calculated wellness insights';