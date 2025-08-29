-- CoreV2 Mental Health Platform - Seed Data
-- Migration: 002_seed_data
-- Version: 1.0.0
-- Created: 2025-08-14

BEGIN;

-- Check if this migration has already been executed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM migrations WHERE migration_name = '002_seed_data') THEN
        RAISE EXCEPTION 'Migration 002_seed_data has already been executed';
    END IF;
END $$;

-- Insert additional crisis resources (US)
INSERT INTO crisis_resources (name, phone, text_number, website, description, category, is_24_7, priority, country, languages) VALUES
('Disaster Distress Helpline', '1-800-985-5990', '66746', 'https://www.samhsa.gov/find-help/disaster-distress-helpline', 'Crisis counseling for natural disasters', 'disaster', true, 11, 'US', ARRAY['en', 'es']),
('National Child Abuse Hotline', '1-800-422-4453', NULL, 'https://www.childhelp.org/hotline', 'Support for child abuse victims and concerned adults', 'child_abuse', true, 12, 'US', ARRAY['en']),
('Elder Abuse Hotline', '1-800-677-1116', NULL, 'https://eldercare.acl.gov', 'Support for elder abuse and neglect', 'elder_abuse', false, 13, 'US', ARRAY['en']),
('Postpartum Support International', '1-800-944-4773', '503-894-9453', 'https://www.postpartum.net', 'Support for postpartum depression and anxiety', 'postpartum', false, 14, 'US', ARRAY['en', 'es'])
ON CONFLICT DO NOTHING;

-- Insert international crisis resources
INSERT INTO crisis_resources (name, phone, text_number, website, description, category, is_24_7, priority, country, languages) VALUES
('Samaritans UK', '116 123', NULL, 'https://www.samaritans.org', 'Emotional support for anyone in distress', 'crisis', true, 1, 'GB', ARRAY['en']),
('Lifeline Australia', '13 11 14', '0477 13 11 14', 'https://www.lifeline.org.au', '24/7 crisis support and suicide prevention', 'crisis', true, 1, 'AU', ARRAY['en']),
('Kids Help Phone Canada', '1-800-668-6868', '686868', 'https://kidshelpphone.ca', 'Support for young people in Canada', 'youth', true, 1, 'CA', ARRAY['en', 'fr']),
('Crisis Services Canada', '1-833-456-4566', '45645', 'https://www.crisisservicescanada.ca', 'National suicide prevention service', 'crisis', true, 2, 'CA', ARRAY['en', 'fr'])
ON CONFLICT DO NOTHING;

-- Insert default journal prompts
INSERT INTO journal_prompts (category, prompt_text, difficulty_level, therapeutic_focus, tags) VALUES
('gratitude', 'What are three things you''re grateful for today, and why?', 1, 'positive_psychology', ARRAY['gratitude', 'daily', 'beginner']),
('gratitude', 'Describe a person who made a positive impact on your life this week.', 2, 'relationships', ARRAY['gratitude', 'relationships', 'weekly']),
('self_reflection', 'What emotion did you feel most strongly today? What triggered it?', 2, 'emotional_awareness', ARRAY['emotions', 'daily', 'awareness']),
('self_reflection', 'If you could change one thing about today, what would it be and why?', 3, 'problem_solving', ARRAY['reflection', 'daily', 'growth']),
('goals', 'What is one small step you can take tomorrow toward a goal that matters to you?', 2, 'goal_setting', ARRAY['goals', 'planning', 'motivation']),
('goals', 'Visualize yourself one year from now. What does your ideal life look like?', 3, 'future_self', ARRAY['goals', 'visualization', 'long_term']),
('emotions', 'Write a letter to your anxiety. What would you want it to know?', 4, 'anxiety_management', ARRAY['anxiety', 'emotions', 'therapeutic']),
('emotions', 'Describe a time when you felt truly peaceful. What made that moment special?', 2, 'mindfulness', ARRAY['peace', 'mindfulness', 'positive']),
('relationships', 'What boundaries do you need to set or reinforce in your relationships?', 4, 'boundaries', ARRAY['relationships', 'boundaries', 'self_care']),
('relationships', 'Write about someone you need to forgive (including yourself).', 5, 'forgiveness', ARRAY['forgiveness', 'healing', 'advanced']),
('coping', 'What coping strategies worked well for you this week?', 2, 'coping_skills', ARRAY['coping', 'weekly', 'skills']),
('coping', 'Describe your ideal self-care day. What activities would you include?', 2, 'self_care', ARRAY['self_care', 'planning', 'wellness']),
('growth', 'What is a mistake you made recently, and what did you learn from it?', 3, 'growth_mindset', ARRAY['growth', 'learning', 'resilience']),
('growth', 'Write about a fear you''d like to overcome. What''s the first step?', 4, 'courage', ARRAY['fear', 'courage', 'challenge'])
ON CONFLICT DO NOTHING;

-- Insert default breathing exercises
INSERT INTO breathing_exercises (name, description, inhale_seconds, hold_seconds, exhale_seconds, cycles, category, difficulty_level, benefits, instructions) VALUES
('4-7-8 Breathing', 'A calming breath pattern that helps reduce anxiety and promote sleep', 4, 7, 8, 4, 'relaxation', 1, 
 ARRAY['Reduces anxiety', 'Improves sleep', 'Lowers blood pressure', 'Calms nervous system'],
 'Exhale completely. Inhale through nose for 4 counts. Hold for 7 counts. Exhale through mouth for 8 counts.'),
('Box Breathing', 'Square breathing technique used by Navy SEALs for stress management', 4, 4, 4, 10, 'focus', 2,
 ARRAY['Improves focus', 'Reduces stress', 'Enhances performance', 'Regulates emotions'],
 'Inhale for 4 counts. Hold for 4 counts. Exhale for 4 counts. Hold empty for 4 counts.'),
('5-5-5 Breathing', 'Simple equal breathing for balance and calm', 5, 0, 5, 10, 'balance', 1,
 ARRAY['Creates balance', 'Easy to remember', 'Quick stress relief', 'Improves concentration'],
 'Breathe in for 5 counts. Breathe out for 5 counts. Keep a steady rhythm.'),
('Belly Breathing', 'Deep diaphragmatic breathing for maximum relaxation', 4, 2, 6, 8, 'relaxation', 1,
 ARRAY['Activates relaxation response', 'Improves oxygen flow', 'Reduces tension', 'Grounds the body'],
 'Place hand on belly. Breathe deeply into belly for 4 counts. Hold for 2. Exhale slowly for 6.'),
('4-4-4-4 Combat Breathing', 'Tactical breathing for high-stress situations', 4, 4, 4, 8, 'stress', 2,
 ARRAY['Rapid stress relief', 'Improves decision making', 'Prevents panic', 'Restores calm'],
 'Inhale for 4. Hold for 4. Exhale for 4. Hold empty for 4. Repeat until calm.')
ON CONFLICT DO NOTHING;

-- Insert default meditation guides
INSERT INTO meditation_guides (title, description, duration_seconds, category, difficulty_level, tags) VALUES
('5-Minute Morning Mindfulness', 'Start your day with clarity and intention', 300, 'mindfulness', 1, ARRAY['morning', 'beginner', 'daily']),
('Body Scan for Sleep', 'Progressive relaxation to prepare for restful sleep', 600, 'sleep', 2, ARRAY['sleep', 'relaxation', 'evening']),
('Anxiety Relief Meditation', 'Calm racing thoughts and find inner peace', 480, 'anxiety', 2, ARRAY['anxiety', 'stress', 'calm']),
('Loving-Kindness Practice', 'Cultivate compassion for yourself and others', 720, 'compassion', 3, ARRAY['love', 'kindness', 'relationships']),
('Focus and Productivity', 'Sharpen concentration for work or study', 600, 'focus', 2, ARRAY['focus', 'work', 'productivity']),
('Walking Meditation', 'Mindful movement for active meditation', 900, 'movement', 2, ARRAY['walking', 'active', 'outdoor']),
('Gratitude Reflection', 'Cultivate appreciation and positive mindset', 420, 'gratitude', 1, ARRAY['gratitude', 'positive', 'daily']),
('Stress Release', 'Let go of tension and find calm', 600, 'stress', 2, ARRAY['stress', 'release', 'relaxation'])
ON CONFLICT DO NOTHING;

-- Insert default affirmations
INSERT INTO affirmations (text, category, tags) VALUES
('I am worthy of love and respect', 'self_worth', ARRAY['worth', 'love', 'respect']),
('I have the strength to overcome any challenge', 'strength', ARRAY['strength', 'resilience', 'courage']),
('I choose peace over worry', 'anxiety', ARRAY['peace', 'calm', 'anxiety']),
('My feelings are valid and important', 'emotions', ARRAY['validation', 'emotions', 'self_compassion']),
('I am exactly where I need to be', 'acceptance', ARRAY['acceptance', 'present', 'trust']),
('I deserve good things in my life', 'self_worth', ARRAY['deserving', 'worth', 'positive']),
('I am growing and learning every day', 'growth', ARRAY['growth', 'learning', 'progress']),
('I trust my ability to make good decisions', 'confidence', ARRAY['trust', 'decisions', 'confidence']),
('I release what I cannot control', 'letting_go', ARRAY['control', 'release', 'acceptance']),
('I am safe in this moment', 'safety', ARRAY['safety', 'present', 'grounding']),
('I choose to focus on what brings me joy', 'positivity', ARRAY['joy', 'focus', 'choice']),
('I am proud of how far I''ve come', 'achievement', ARRAY['pride', 'progress', 'achievement']),
('I give myself permission to rest', 'self_care', ARRAY['rest', 'permission', 'self_care']),
('I am capable of amazing things', 'potential', ARRAY['capability', 'potential', 'confidence']),
('I choose healing over suffering', 'healing', ARRAY['healing', 'choice', 'recovery'])
ON CONFLICT DO NOTHING;

-- Create demo/test user (for development only - remove in production)
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Only create demo user if not in production
    IF (SELECT COUNT(*) FROM users WHERE email = 'demo@corev2.app') = 0 THEN
        -- Create demo user
        INSERT INTO users (email, username, password_hash, role, status, email_verified)
        VALUES ('demo@corev2.app', 'demo_user', '$2a$10$YourHashedPasswordHere', 'user', 'active', true)
        RETURNING id INTO demo_user_id;
        
        -- Create demo user profile
        INSERT INTO user_profiles (user_id, display_name, bio, timezone, locale)
        VALUES (demo_user_id, 'Demo User', 'This is a demo account for testing the platform', 'America/New_York', 'en');
        
        -- Create demo user preferences
        INSERT INTO user_preferences (user_id, theme, notifications_enabled)
        VALUES (demo_user_id, 'light', true);
        
        -- Add some demo mood entries
        INSERT INTO mood_entries (user_id, mood_score, mood_label, notes, created_at)
        VALUES 
        (demo_user_id, 7, 'Good', 'Feeling positive today', NOW() - INTERVAL '1 day'),
        (demo_user_id, 5, 'Neutral', 'Average day', NOW() - INTERVAL '2 days'),
        (demo_user_id, 8, 'Great', 'Had a breakthrough in therapy', NOW() - INTERVAL '3 days');
        
        -- Create a demo safety plan
        INSERT INTO safety_plans (user_id, warning_signs, internal_coping_strategies, reasons_for_living)
        VALUES (
            demo_user_id,
            ARRAY['Feeling overwhelmed', 'Isolating from others', 'Negative self-talk'],
            ARRAY['Deep breathing exercises', 'Go for a walk', 'Listen to calming music'],
            ARRAY['My family', 'My goals', 'My pets']
        );
    END IF;
END $$;

-- Record migration execution
INSERT INTO migrations (migration_name) VALUES ('002_seed_data');

COMMIT;